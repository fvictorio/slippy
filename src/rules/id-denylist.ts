import {
  ConstantDefinition,
  ContractDefinition,
  EnumDefinition,
  ErrorDefinition,
  EventDefinition,
  FunctionDefinition,
  InterfaceDefinition,
  LibraryDefinition,
  ModifierDefinition,
  StateVariableDefinition,
  StructDefinition,
  UserDefinedValueTypeDefinition,
} from "@nomicfoundation/slang/ast";
import {
  LintResult,
  RuleContext,
  RuleDefinition,
  RuleWithConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  NonterminalKind,
} from "@nomicfoundation/slang/cst";
import * as z from "zod";
import { AssertionError } from "../errors.js";

const DEFAULT_DENYLIST = ["I", "l", "O"];

const Schema = z.array(z.string()).default(DEFAULT_DENYLIST);
type Config = z.infer<typeof Schema>;

export const IdDenylist: RuleDefinition<Config> = {
  name: "id-denylist",
  recommended: true,
  parseConfig: (config: unknown) => {
    return Schema.parse(config);
  },
  create: function (config) {
    return new IdDenylistRule(this.name, config);
  },
};

class IdDenylistRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): LintResult[] {
    const results: LintResult[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextNonterminalWithKinds([
        NonterminalKind.ContractDefinition,
        NonterminalKind.InterfaceDefinition,
        NonterminalKind.LibraryDefinition,
        NonterminalKind.StructDefinition,
        NonterminalKind.EnumDefinition,
        NonterminalKind.ConstantDefinition,
        NonterminalKind.StateVariableDefinition,
        NonterminalKind.FunctionDefinition,
        NonterminalKind.ModifierDefinition,
        NonterminalKind.EventDefinition,
        NonterminalKind.UserDefinedValueTypeDefinition,
        NonterminalKind.ErrorDefinition,
      ])
    ) {
      assertNonterminalNode(cursor.node);
      let nameNode;
      if (cursor.node.kind === NonterminalKind.ContractDefinition) {
        nameNode = new ContractDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.InterfaceDefinition) {
        nameNode = new InterfaceDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.LibraryDefinition) {
        nameNode = new LibraryDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.StructDefinition) {
        nameNode = new StructDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.EnumDefinition) {
        nameNode = new EnumDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.ConstantDefinition) {
        nameNode = new ConstantDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.StateVariableDefinition) {
        nameNode = new StateVariableDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.FunctionDefinition) {
        nameNode = new FunctionDefinition(cursor.node).name.variant;
      } else if (cursor.node.kind === NonterminalKind.ModifierDefinition) {
        nameNode = new ModifierDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.EventDefinition) {
        nameNode = new EventDefinition(cursor.node).name;
      } else if (
        cursor.node.kind === NonterminalKind.UserDefinedValueTypeDefinition
      ) {
        nameNode = new UserDefinedValueTypeDefinition(cursor.node).name;
      } else if (cursor.node.kind === NonterminalKind.ErrorDefinition) {
        nameNode = new ErrorDefinition(cursor.node).name;
      } else {
        throw new AssertionError(`Unexpected node kind: ${cursor.node.kind}`);
      }
      const contractName = nameNode.unparse();

      while (cursor.node.id !== nameNode.id && cursor.goToNext()) {
        // continue until we reach the name node
      }

      if (this.config.includes(contractName)) {
        results.push({
          rule: this.name,
          message: `Identifier '${contractName}' is restricted`,
          sourceId: file.id,
          line: cursor.textRange.start.line,
          column: cursor.textRange.start.column,
        });
      }
    }

    return results;
  }
}
