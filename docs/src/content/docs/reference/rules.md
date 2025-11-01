---
title: Slippy rules
---

_Rules that have a 🔧 next to them can be automatically fixed by running Slippy with the `--fix` flag._

- [`compatible-pragma`](/slippy/rules/compatible-pragma): checks that the minimum supported pragma version is compatible with the features used in the file.
- [`curly`](/slippy/rules/curly): enforces the use of curly braces for all control structures.
- [`explicit-types`](/slippy/rules/explicit-types): enforces or forbids the use of aliases like `uint` instead of `uint256`. 🔧
- [`id-denylist`](/slippy/rules/id-denylist): allows you to specify a list of forbidden identifiers.
- [`imports-on-top`](/slippy/rules/imports-on-top): enforces that all import statements are at the top of the file.
- [`max-state-vars`](/slippy/rules/max-state-vars): limits the number of state variables in a contract.
- [`named-return-params`](/slippy/rules/named-return-params): enforces that functions with multiple return parameters use named return parameters.
- [`naming-convention`](/slippy/rules/naming-convention): enforces a naming convention across the codebase.
- [`no-console`](/slippy/rules/no-console): forbids the use of `console.log` and the import of `console.sol`.
- [`no-default-visibility`](/slippy/rules/no-default-visibility): forbids the use of default visibility for state variables. 🔧
- [`no-duplicate-imports`](/slippy/rules/no-duplicate-imports): forbids importing the same file multiple times.
- [`no-empty-blocks`](/slippy/rules/no-empty-blocks): forbids blocks without statements.
- [`no-global-imports`](/slippy/rules/no-global-imports): forbids global imports like `import "./foo.sol"`.
- [`no-hardcoded-gas`](/slippy/rules/no-hardcoded-gas): disallows hardcoded gas values in call options.
- [`no-restricted-syntax`](/slippy/rules/no-restricted-syntax): disallows syntax patterns specified with [Slang queries](https://nomicfoundation.github.io/slang/latest/user-guide/06-query-language/01-query-syntax/).
- [`no-send`](/slippy/rules/no-send): forbids the use of `send` and `transfer` for sending value, in favor of using `call` with value.
- [`no-tx-origin`](/slippy/rules/no-tx-origin): forbids the use of `tx.origin`.
- [`no-unchecked-calls`](/slippy/rules/no-unchecked-calls): disallows low-level calls like `call`, `staticcall`, and `delegatecall` that don't use their return values.
- [`no-uninitialized-immutable-references`](/slippy/rules/no-uninitialized-immutable-references): forbids using immutable references before they are initialized.
- [`no-unnecessary-boolean-compare`](/slippy/rules/no-unnecessary-boolean-compare): forbids unnecessary comparisons to boolean literals.
- [`no-unnecessary-else`](/slippy/rules/no-unnecessary-else): disallows `else` blocks following `if` statements that end with a control-flow-terminating statement (`return`, `break`, etc.)
- [`no-unused-vars`](/slippy/rules/no-unused-vars): detects unused variables, imports and functions.
- [`one-contract-per-file`](/slippy/rules/one-contract-per-file): enforces that a file contains at most one contract/interface/library definition.
- [`private-vars`](/slippy/rules/private-vars): enforces that all state variables are private.
- [`require-revert-reason`](/slippy/rules/require-revert-reason): enforces that all reverts have a reason.
- [`sort-imports`](/slippy/rules/sort-imports): enforces a specific order for import statements.
- [`sort-members`](/slippy/rules/sort-members): enforces a specific order for top-level elements and contract/interface/library members.
- [`sort-modifiers`](/slippy/rules/sort-modifiers): enforces a specific order for modifiers. 🔧
- [`yul-prefer-iszero`](/slippy/rules/yul-prefer-iszero): recommends using `iszero` instead of `eq` when comparing to the `0` literal in Yul code.

Don't see a rule you need? [Open an issue](https://github.com/slippy-lint/slippy/issues/new).
