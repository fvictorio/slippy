import { ContractMember, SourceUnitMember } from "@nomicfoundation/slang/ast";
import * as z from "zod";
import {
  Diagnostic,
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

const memberToSlangKind: Record<string, NonterminalKind> = {
  pragma: NonterminalKind.PragmaDirective,
  import: NonterminalKind.ImportDirective,
  userDefinedValueType: NonterminalKind.UserDefinedValueTypeDefinition,
  usingFor: NonterminalKind.UsingDirective,
  constant: NonterminalKind.ConstantDefinition,
  enum: NonterminalKind.EnumDefinition,
  struct: NonterminalKind.StructDefinition,
  event: NonterminalKind.EventDefinition,
  error: NonterminalKind.ErrorDefinition,
  function: NonterminalKind.FunctionDefinition,
  interface: NonterminalKind.InterfaceDefinition,
  library: NonterminalKind.LibraryDefinition,
  contract: NonterminalKind.ContractDefinition,
  stateVariable: NonterminalKind.StateVariableDefinition,
  constructor: NonterminalKind.ConstructorDefinition,
  modifier: NonterminalKind.ModifierDefinition,
  receive: NonterminalKind.ReceiveFunctionDefinition,
  fallback: NonterminalKind.FallbackFunctionDefinition,
};

const fileMembersOrder: Array<keyof typeof memberToSlangKind> = [
  "pragma",
  "import",
  "userDefinedValueType",
  "usingFor",
  "constant",
  "enum",
  "struct",
  "event",
  "error",
  "function",
  "interface",
  "library",
  "contract",
];

const FileMemberSchema = z.enum(fileMembersOrder);

const contractMembersOrder: Array<keyof typeof memberToSlangKind> = [
  "userDefinedValueType",
  "usingFor",
  "enum",
  "struct",
  "event",
  "error",
  "stateVariable",
  "constructor",
  "modifier",
  "function",
  "receive",
  "fallback",
];

const ContractMemberSchema = z.enum(contractMembersOrder);

function uniqueMembers(a: string[]): boolean {
  return a.length === new Set(a).size;
}

const Schema = z
  .object({
    file: z
      .array(FileMemberSchema)
      .refine(uniqueMembers, "Custom order must not contain duplicates")
      .default(fileMembersOrder),
    contract: z
      .array(ContractMemberSchema)
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

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const cursor = file.createTreeCursor();

    diagnostics.push(
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
      diagnostics.push(
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
      diagnostics.push(
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
      diagnostics.push(
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

    return diagnostics;
  }

  private checkMembers<T extends SourceUnitMember | ContractMember>(
    file: SlangFile,
    cursor: Cursor,
    label: string,
    AstConstructor: { new (node: NonterminalNode): T },
    memberKind: NonterminalKind,
    membersOrder: string[],
  ): Diagnostic[] {
    const members: Array<{ kind: NonterminalKind; cursor: Cursor }> = [];

    const order = membersOrder.map((x) => {
      return memberToSlangKind[x];
    });

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
