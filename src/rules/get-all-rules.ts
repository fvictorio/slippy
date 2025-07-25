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

export function getAllRules() {
  return [
    ExplicitTypes,
    IdDenylist,
    ImportsOnTop,
    MaxStateVars,
    SortModifiers,
    NamingConvention,
    NoConsole,
    NoDuplicateImports,
    NoEmptyBlocks,
    NoGlobalImports,
    NoTxOrigin,
    NoUninitializedImmutableReference,
    NoUnusedVars,
    PrivateVars,
    RequireRevertReason,
    SortImports,
    NoDefaultVisibility,
  ];
}
