import { NoTxOrigin } from "./no-tx-origin.js";
import { ExplicitTypes } from "./explicit-types.js";
import { IdDenylist } from "./id-denylist.js";
import { ImportsOnTop } from "./imports-on-top.js";
import { MaxStateVars } from "./max-state-vars.js";
import { SortModifiers } from "./sort-modifiers.js";
import { NoConsole } from "./no-console.js";
import { NoDuplicateImports } from "./no-duplicate-imports.js";
import { NoGlobalImports } from "./no-global-imports.js";
import { NoUninitializedImmutableReference } from "./no-uninitialized-immutable-reference.js";
import { NoUnusedVars } from "./no-unused-vars.js";
import { PrivateVars } from "./private-vars.js";
import { NamingConvention } from "./naming-convention.js";
import { SortImports } from "./sort-imports.js";
import { NoDefaultVisibility } from "./no-default-visibility.js";
import { RequireRevertReason } from "./require-revert-reason.js";
import { NoEmptyBlocks } from "./no-empty-blocks.js";
import { RuleDefinition } from "./types.js";
import { Curly } from "./curly.js";
import { NoSend } from "./no-send.js";
import { NamedReturnParams } from "./named-return-params.js";
import { NoRestrictedSyntax } from "./no-restricted-syntax.js";
import { NoUncheckedCalls } from "./no-unchecked-calls.js";

export function getAllRules(): Array<RuleDefinition<any>> {
  return [
    Curly,
    ExplicitTypes,
    IdDenylist,
    ImportsOnTop,
    MaxStateVars,
    NamedReturnParams,
    NamingConvention,
    NoConsole,
    NoDefaultVisibility,
    NoDuplicateImports,
    NoEmptyBlocks,
    NoGlobalImports,
    NoRestrictedSyntax,
    NoSend,
    NoTxOrigin,
    NoUncheckedCalls,
    NoUninitializedImmutableReference,
    NoUnusedVars,
    PrivateVars,
    RequireRevertReason,
    SortImports,
    SortModifiers,
  ];
}
