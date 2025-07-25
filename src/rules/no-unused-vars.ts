import {
  CompilationUnit,
  File as SlangFile,
} from "@nomicfoundation/slang/compilation";
import {
  LintResult,
  RuleContext,
  RuleWithConfig,
  RuleDefinitionWithConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  Cursor,
  NonterminalKind,
  TerminalKind,
  TextRange,
} from "@nomicfoundation/slang/cst";
import { Definition } from "@nomicfoundation/slang/bindings";
import * as z from "zod";

const Schema = z
  .object({
    ignorePattern: z.string().optional(),
  })
  .default({});

type Config = z.infer<typeof Schema>;

export const NoUnusedVars: RuleDefinitionWithConfig<Config> = {
  name: "no-unused-vars",
  recommended: true,
  parseConfig: (config: unknown) => Schema.parse(config),
  create: function (config: Config) {
    return new NoUnusedVarsRule(this.name, config);
  },
};

class NoUnusedVarsRule implements RuleWithConfig<Config> {
  private ignorePattern?: RegExp;

  public constructor(
    public name: string,
    public config: Config,
  ) {
    this.ignorePattern =
      config.ignorePattern !== undefined
        ? new RegExp(config.ignorePattern)
        : undefined;
  }

  public run({ file, unit }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const inheritDocComments = findInheritDocComments(file);
    const unusedVars = findUnusedVarsInFile(unit, file, inheritDocComments);

    for (const unusedVar of unusedVars) {
      if (unusedVar.definition.definiensLocation.isUserFileLocation()) {
        if (
          this.ignorePattern !== undefined &&
          this.ignorePattern.test(unusedVar.name)
        ) {
          continue;
        }

        results.push({
          rule: this.name,
          sourceId: unusedVar.definition.definiensLocation.fileId,
          message: `'${unusedVar.name}' is defined but never used`,
          line: unusedVar.textRange.start.line,
          column: unusedVar.textRange.start.column,
        });
      }
    }

    return results;
  }
}
interface UnusedVar {
  name: string;
  definition: Definition;
  textRange: TextRange;
}

function findUnusedVarsInFile(
  unit: CompilationUnit,
  file: SlangFile,
  inheritDocComments: string[],
): UnusedVar[] {
  const unusedDefinitions = [];
  const cursor = file.createTreeCursor();

  const unusedPrivateVariables = findUnusedPrivateVariables(
    unit,
    cursor.spawn(),
  );

  unusedDefinitions.push(...unusedPrivateVariables);

  const unusedPrivateFunctions = findUnusedPrivateFunctions(
    unit,
    cursor.spawn(),
  );

  unusedDefinitions.push(...unusedPrivateFunctions);

  while (
    cursor.goToNextNonterminalWithKind(NonterminalKind.FunctionDefinition)
  ) {
    const unusedDefinitionsInFunction = findUnusedDefinitionsInFunction(
      unit,
      cursor.spawn(),
    );

    unusedDefinitions.push(...unusedDefinitionsInFunction);
  }

  const unusedImportedNames = findUnusedImportedNames(
    unit,
    cursor.spawn(),
    inheritDocComments,
  );

  unusedDefinitions.push(...unusedImportedNames);

  return unusedDefinitions;
}

function findUnusedDefinitionsInFunction(
  unit: CompilationUnit,
  functionDefinitionCursor: Cursor,
): UnusedVar[] {
  const definitions: UnusedVar[] = [];

  assertNonterminalNode(
    functionDefinitionCursor.node,
    NonterminalKind.FunctionDefinition,
  );

  const hasEmptyBlock = !functionDefinitionCursor
    .spawn()
    .goToNextNonterminalWithKind(NonterminalKind.Statement);

  if (!hasEmptyBlock) {
    let parametersCursor = functionDefinitionCursor.spawn();
    parametersCursor.goToNextNonterminalWithKind(
      NonterminalKind.ParametersDeclaration,
    );
    parametersCursor = parametersCursor.spawn();

    while (parametersCursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
      const definition = unit.bindingGraph.definitionAt(parametersCursor);

      if (definition === undefined) {
        continue;
      }

      if (definition.references().length === 0) {
        definitions.push({
          name: parametersCursor.node.unparse(),
          definition,
          textRange: parametersCursor.textRange,
        });
      }
    }
  }

  const declarationsCursor = functionDefinitionCursor.spawn();

  while (
    declarationsCursor.goToNextNonterminalWithKind(
      NonterminalKind.VariableDeclarationStatement,
    )
  ) {
    // ignore the type of the variable
    declarationsCursor.goToNextNonterminalWithKind(
      NonterminalKind.VariableDeclarationType,
    );
    declarationsCursor.goToNextSibling();

    if (!declarationsCursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
      continue;
    }

    const definition = unit.bindingGraph.definitionAt(declarationsCursor);

    if (definition === undefined) {
      continue;
    }

    if (definition.references().length === 0) {
      definitions.push({
        name: declarationsCursor.node.unparse(),
        textRange: declarationsCursor.textRange,
        definition,
      });
    }
  }

  return definitions;
}

function findUnusedPrivateVariables(
  unit: CompilationUnit,
  cursor: Cursor,
): UnusedVar[] {
  const definitions: UnusedVar[] = [];

  while (
    cursor.goToNextNonterminalWithKind(NonterminalKind.StateVariableDefinition)
  ) {
    const variableDefinitionCursor = cursor.spawn();
    const isPrivate = variableDefinitionCursor
      .spawn()
      .goToNextTerminalWithKind(TerminalKind.PrivateKeyword);

    if (!isPrivate) {
      continue;
    }

    // ignore the type of the variable
    variableDefinitionCursor.goToNextNonterminalWithKind(
      NonterminalKind.TypeName,
    );
    variableDefinitionCursor.goToNextSibling();

    if (
      !variableDefinitionCursor.goToNextTerminalWithKind(
        TerminalKind.Identifier,
      )
    ) {
      continue;
    }

    const definition = unit.bindingGraph.definitionAt(variableDefinitionCursor);

    if (definition === undefined) {
      continue;
    }

    if (definition.references().length === 0) {
      definitions.push({
        name: variableDefinitionCursor.node.unparse(),
        textRange: variableDefinitionCursor.textRange,
        definition,
      });
    }
  }

  return definitions;
}

function findUnusedPrivateFunctions(
  unit: CompilationUnit,
  cursor: Cursor,
): UnusedVar[] {
  const definitions: UnusedVar[] = [];

  while (
    cursor.goToNextNonterminalWithKind(NonterminalKind.FunctionDefinition)
  ) {
    const isPrivate = checkIsPrivateFunction(cursor.spawn());

    if (!isPrivate) {
      continue;
    }

    const definition = getFunctionNameDefinition(unit, cursor.spawn());

    if (definition === undefined) {
      continue;
    }

    if (!definition.nameLocation.isUserFileLocation()) {
      continue;
    }

    const definitionCursor = definition.nameLocation.cursor;

    if (definition.references().length === 0) {
      definitions.push({
        name: definitionCursor.node.unparse(),
        textRange: definitionCursor.textRange,
        definition,
      });
    }
  }

  return definitions;
}

function findUnusedImportedNames(
  unit: CompilationUnit,
  cursor: Cursor,
  inheritDocComments: string[],
): UnusedVar[] {
  const definitions: UnusedVar[] = [];

  while (
    cursor.goToNextNonterminalWithKinds([
      NonterminalKind.PathImport,
      NonterminalKind.NamedImport,
      NonterminalKind.ImportDeconstructionSymbol,
    ])
  ) {
    let variableDefinitionCursor;

    if (
      cursor.node.kind === NonterminalKind.PathImport ||
      cursor.node.kind === NonterminalKind.NamedImport
    ) {
      if (!cursor.goToNextNonterminalWithKind(NonterminalKind.ImportAlias)) {
        continue;
      }
      if (!cursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
        continue;
      }
      variableDefinitionCursor = cursor.spawn();
    } else if (
      cursor.node.kind === NonterminalKind.ImportDeconstructionSymbol
    ) {
      const importAliasCursor = cursor.spawn();
      const hasAlias = importAliasCursor.goToNextNonterminalWithKind(
        NonterminalKind.ImportAlias,
      );
      if (hasAlias) {
        if (
          !importAliasCursor.goToNextTerminalWithKind(TerminalKind.Identifier)
        ) {
          continue;
        }
        variableDefinitionCursor = importAliasCursor;
      } else {
        if (!cursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
          continue;
        }
        variableDefinitionCursor = cursor;
      }
    } else {
      continue;
    }

    const definition = unit.bindingGraph.definitionAt(variableDefinitionCursor);

    if (definition === undefined) {
      continue;
    }

    if (definition.references().length === 0) {
      const name = variableDefinitionCursor.node.unparse();

      if (!inheritDocComments.includes(name)) {
        definitions.push({
          name,
          textRange: variableDefinitionCursor.textRange,
          definition,
        });
      }
    }
  }

  return definitions;
}

function checkIsPrivateFunction(cursor: Cursor): boolean {
  if (!cursor.goToNextNonterminalWithKind(NonterminalKind.FunctionAttributes))
    return false;
  cursor = cursor.spawn();

  return cursor.goToNextTerminalWithKind(TerminalKind.PrivateKeyword);
}

function getFunctionNameDefinition(
  unit: CompilationUnit,
  functionDefinitionCursor: Cursor,
): Definition | undefined {
  if (
    !functionDefinitionCursor.goToNextNonterminalWithKind(
      NonterminalKind.FunctionName,
    )
  ) {
    return undefined;
  }

  if (
    !functionDefinitionCursor.goToNextTerminalWithKind(TerminalKind.Identifier)
  ) {
    return undefined;
  }

  return unit.bindingGraph.definitionAt(functionDefinitionCursor);
}

function findInheritDocComments(file: SlangFile): string[] {
  const results: string[] = [];
  const cursor = file.createTreeCursor();

  while (
    cursor.goToNextTerminalWithKinds([
      TerminalKind.SingleLineNatSpecComment,
      TerminalKind.MultiLineNatSpecComment,
    ])
  ) {
    const commentText = cursor.node.unparse();
    const inheritDocMatch = commentText.match(/@inheritdoc\s+([$\w]+)/);

    if (inheritDocMatch) {
      results.push(inheritDocMatch[1]);
    }
  }

  return results;
}
