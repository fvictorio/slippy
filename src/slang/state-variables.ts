import { StateVariableDefinition } from "@nomicfoundation/slang/ast";
import { TerminalKind } from "@nomicfoundation/slang/cst";

export function isPrivate(stateVariable: StateVariableDefinition): boolean {
  return stateVariable.attributes.items.some(
    (attribute) =>
      "kind" in attribute.variant &&
      attribute.variant.kind === TerminalKind.PrivateKeyword,
  );
}

export function isConstant(stateVariable: StateVariableDefinition): boolean {
  return stateVariable.attributes.items.some(
    (attribute) =>
      "kind" in attribute.variant &&
      attribute.variant.kind === TerminalKind.ConstantKeyword,
  );
}

export function isImmutable(stateVariable: StateVariableDefinition): boolean {
  return stateVariable.attributes.items.some(
    (attribute) =>
      "kind" in attribute.variant &&
      attribute.variant.kind === TerminalKind.ImmutableKeyword,
  );
}

export function hasDefaultVisibility(
  stateVariable: StateVariableDefinition,
): boolean {
  return !stateVariable.attributes.items.some(
    (attribute) =>
      "kind" in attribute.variant &&
      (attribute.variant.kind === TerminalKind.PrivateKeyword ||
        attribute.variant.kind === TerminalKind.InternalKeyword ||
        attribute.variant.kind === TerminalKind.PublicKeyword),
  );
}
