import { ContractMember, SourceUnitMember } from "@nomicfoundation/slang/ast";
import * as z from "zod";
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
  NonterminalNode,
} from "@nomicfoundation/slang/cst";
import { ignoreLeadingTrivia } from "../slang/trivia.js";
import { File as SlangFile } from "@nomicfoundation/slang/compilation";

const fileMembersOrder = [
  "PragmaDirective",
  "ImportDirective",
  "UserDefinedValueTypeDefinition",
  "UsingDirective",
  "ConstantDefinition",
  "EnumDefinition",
  "StructDefinition",
  "EventDefinition",
  "ErrorDefinition",
  "FunctionDefinition",
  "InterfaceDefinition",
  "LibraryDefinition",
  "ContractDefinition",
];

const FileMemberSchema = z.enum(fileMembersOrder);

const contractMembersOrder = [
  "UserDefinedValueTypeDefinition",
  "UsingDirective",
  "EnumDefinition",
  "StructDefinition",
  "EventDefinition",
  "ErrorDefinition",
  "StateVariableDefinition",
  "ConstructorDefinition",
  "ModifierDefinition",
  "FunctionDefinition",
  "ReceiveFunctionDefinition",
  "FallbackFunctionDefinition",
  "UnnamedFunctionDefinition",
];

const ContractMemberSchema = z.enum(contractMembersOrder);

function uniqueMembers(a: string[]): boolean {
  return a.length === new Set(a).size;
}

const Schema = z
  .object({
    file: z
      .array(FileMemberSchema)
      .nonempty()
      .refine(uniqueMembers, "Custom order must not contain duplicates")
      .default(fileMembersOrder),
    contract: z
      .array(ContractMemberSchema)
      .nonempty()
      .refine(uniqueMembers, "Custom order must not contain duplicates")
      .default(contractMembersOrder),
  })
  .default({ file: fileMembersOrder, contract: contractMembersOrder });

type Config = z.infer<typeof Schema>;

export const SortMembers: RuleDefinitionWithConfig<Config> = {
  name: "sort-members",
  recommended: false,
  parseConfig: (config: unknown) => Schema.parse(config),
  create: function (config) {
    return new SortMembersRule(this.name, config);
  },
};

class SortMembersRule implements RuleWithConfig<Config> {
  constructor(
    public name: string,
    public config: Config,
  ) {}

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
        this.config.file,
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
          this.config.contract,
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
          this.config.contract,
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
          this.config.contract,
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
    order: string[],
  ): LintResult[] {
    const members: Array<{ kind: NonterminalKind; cursor: Cursor }> = [];

    const compareFunction = buildCompareMembers(order);

    while (cursor.goToNextNonterminalWithKind(memberKind)) {
      assertNonterminalNode(cursor.node, memberKind);
      const astNode = new AstConstructor(cursor.node);
      const kind = astNode.variant.cst.kind;

      if (order.includes(kind)) {
        members.push({ kind, cursor: cursor.spawn() });
      }
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

function buildCompareMembers(order: string[]) {
  return (a: NonterminalKind, b: NonterminalKind) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);

    return indexA - indexB;
  };
}
