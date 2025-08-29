import { ContractMember, SourceUnitMember } from "@nomicfoundation/slang/ast";
import { AssertionError } from "../errors.js";
import {
  LintResult,
  RuleContext,
  RuleWithoutConfig,
  RuleDefinitionWithoutConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  Cursor,
  NonterminalKind,
  NonterminalNode,
} from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../slang/trivia.js";
import { File as SlangFile } from "@nomicfoundation/slang/compilation";

export const SortMembers: RuleDefinitionWithoutConfig = {
  name: "sort-members",
  recommended: false,
  create: function () {
    return new SortMembersRule(this.name);
  },
};

class SortMembersRule implements RuleWithoutConfig {
  constructor(public name: string) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];
    const cursor = file.createTreeCursor();

    results.push(
      ...this.checkMembers(
        file,
        cursor.spawn(),
        "Source unit member",
        SourceUnitMember,
        NonterminalKind.SourceUnitMember,
        compareSourceUnitMembers,
      ),
    );

    const contractsCursor = cursor.spawn();
    while (
      contractsCursor.goToNextNonterminalWithKind(
        NonterminalKind.ContractDefinition,
      )
    ) {
      results.push(
        ...this.checkMembers(
          file,
          contractsCursor.spawn(),
          "Contract member",
          ContractMember,
          NonterminalKind.ContractMember,
          compareContractMembers,
        ),
      );
    }

    const interfacesCursor = cursor.spawn();
    while (
      interfacesCursor.goToNextNonterminalWithKind(
        NonterminalKind.InterfaceDefinition,
      )
    ) {
      results.push(
        ...this.checkMembers(
          file,
          interfacesCursor.spawn(),
          "Interface member",
          ContractMember,
          NonterminalKind.ContractMember,
          compareContractMembers,
        ),
      );
    }

    const librariesCursor = cursor.spawn();
    while (
      librariesCursor.goToNextNonterminalWithKind(
        NonterminalKind.LibraryDefinition,
      )
    ) {
      results.push(
        ...this.checkMembers(
          file,
          librariesCursor.spawn(),
          "Library member",
          ContractMember,
          NonterminalKind.ContractMember,
          compareContractMembers,
        ),
      );
    }

    return results;
  }

  private checkMembers<T extends SourceUnitMember | ContractMember>(
    file: SlangFile,
    cursor: Cursor,
    label: string,
    AstConstructor: { new (node: NonterminalNode): T },
    memberKind: NonterminalKind,
    compareFunction: (a: NonterminalKind, b: NonterminalKind) => number,
  ): LintResult[] {
    const members: Array<{ kind: NonterminalKind; cursor: Cursor }> = [];

    while (cursor.goToNextNonterminalWithKind(memberKind)) {
      assertNonterminalNode(cursor.node, memberKind);
      const astNode = new AstConstructor(cursor.node);
      members.push({ kind: astNode.variant.cst.kind, cursor: cursor.spawn() });
    }

    const sortedMembers = [...members].sort((a, b) => {
      return compareFunction(a.kind, b.kind);
    });

    for (let i = 0; i < members.length; i++) {
      if (members[i].kind !== sortedMembers[i].kind) {
        let correctPosition = sortedMembers[i];

        for (const sortedMember of sortedMembers) {
          if (compareFunction(members[i].kind, sortedMember.kind) === 1) {
            correctPosition = sortedMember;
          }
        }

        const memberKind = members[i].kind;
        const correctPositionKind = correctPosition.kind;
        const textRangeCursor = members[i].cursor.spawn();
        ignoreLeadingTrivia(textRangeCursor);

        // we only report the first violation
        return [
          {
            rule: this.name,
            sourceId: file.id,
            message: `${label} of kind "${memberKind}" should come after kind "${correctPositionKind}"`,
            line: textRangeCursor.textRange.start.line,
            column: textRangeCursor.textRange.start.column,
          },
        ];
      }
    }

    return [];
  }
}

function compareMembers(
  order: NonterminalKind[],
  label: string,
  a: NonterminalKind,
  b: NonterminalKind,
): number {
  const indexA = order.indexOf(a);
  if (indexA === -1) {
    throw new AssertionError(`Unrecognized ${label} member ${a}`);
  }

  const indexB = order.indexOf(b);
  if (indexB === -1) {
    throw new AssertionError(`Unrecognized ${label} member ${b}`);
  }

  return indexA - indexB;
}

const sourceUnitMembersOrder = [
  NonterminalKind.PragmaDirective,
  NonterminalKind.ImportDirective,
  NonterminalKind.UserDefinedValueTypeDefinition,
  NonterminalKind.UsingDirective,
  NonterminalKind.ConstantDefinition,
  NonterminalKind.EnumDefinition,
  NonterminalKind.StructDefinition,
  NonterminalKind.EventDefinition,
  NonterminalKind.ErrorDefinition,
  NonterminalKind.FunctionDefinition,
  NonterminalKind.InterfaceDefinition,
  NonterminalKind.LibraryDefinition,
  NonterminalKind.ContractDefinition,
];

const contractMembersOrder = [
  NonterminalKind.UserDefinedValueTypeDefinition,
  NonterminalKind.UsingDirective,
  NonterminalKind.EnumDefinition,
  NonterminalKind.StructDefinition,
  NonterminalKind.EventDefinition,
  NonterminalKind.ErrorDefinition,
  NonterminalKind.StateVariableDefinition,
  NonterminalKind.ConstructorDefinition,
  NonterminalKind.ModifierDefinition,
  NonterminalKind.FunctionDefinition,
  NonterminalKind.ReceiveFunctionDefinition,
  NonterminalKind.FallbackFunctionDefinition,
  NonterminalKind.UnnamedFunctionDefinition,
];

function compareSourceUnitMembers(
  a: NonterminalKind,
  b: NonterminalKind,
): number {
  return compareMembers(sourceUnitMembersOrder, "source unit", a, b);
}

function compareContractMembers(
  a: NonterminalKind,
  b: NonterminalKind,
): number {
  return compareMembers(contractMembersOrder, "contract", a, b);
}
