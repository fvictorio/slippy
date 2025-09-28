# Slippy

Slippy is a linter for Solidity that's simple, powerful, and thoughtfully built.

## Installation

Install it:

```bash
npm install --save-dev @slippy-lint/slippy
```

Initialize a config file:

```bash
npx slippy --init
```

Run it:

```bash
npx slippy "contracts/**/*.sol"
```

# Why Slippy?

You can read a more detailed [comparison between Slippy and Solhint](/docs/slippy-vs-solhint.md), but here's a summary:

- A single, flexible configuration that lets you easily enable or disable rules for specific parts of your codebase
- A unified [`naming-convention`](/docs/rules/naming-convention.md) rule
- A more accurate [`no-unused-vars`](/docs/rules/no-unused-vars.md) rule
- Unused comment directives like `// slippy-disable-line` are reported
- No formatting rules
- Semantic versioning

# Configuration

Slippy's configuration lives in a `slippy.config.js` file, which exports the configuration that Slippy will use to lint your code. Here’s a minimal example:

```js
module.exports = {
  rules: {
    "no-console": "warn",
    "no-unused-vars": ["error", { ignorePattern: "^_" }],
  },
};
```

For more details on configuring Slippy, including advanced features like cascading configurations, file ignores, and comment directives, see the [configuration documentation](/docs/config.md).

# Rules

_Rules that have a 🔧 next to them can be automatically fixed by running Slippy with the `--fix` flag._

- [`compatible-pragma`](/docs/rules/compatible-pragma.md): checks that the minimum supported pragma version is compatible with the features used in the file.
- [`curly`](/docs/rules/curly.md): enforces the use of curly braces for all control structures.
- [`explicit-types`](/docs/rules/explicit-types.md): enforces or forbids the use of aliases like `uint` instead of `uint256`. 🔧
- [`id-denylist`](/docs/rules/id-denylist.md): allows you to specify a list of forbidden identifiers.
- [`imports-on-top`](/docs/rules/imports-on-top.md): enforces that all import statements are at the top of the file.
- [`max-state-vars`](/docs/rules/max-state-vars.md): limits the number of state variables in a contract.
- [`named-return-params`](/docs/rules/named-return-params.md): enforces that functions with multiple return parameters use named return parameters.
- [`naming-convention`](/docs/rules/naming-convention.md): enforces a naming convention across the codebase.
- [`no-console`](/docs/rules/no-console.md): forbids the use of `console.log` and the import of `console.sol`.
- [`no-default-visibility`](/docs/rules/no-default-visibility.md): forbids the use of default visibility for state variables. 🔧
- [`no-duplicate-imports`](/docs/rules/no-duplicate-imports.md): forbids importing the same file multiple times.
- [`no-empty-blocks`](/docs/rules/no-empty-blocks.md): forbids blocks without statements.
- [`no-global-imports`](/docs/rules/no-global-imports.md): forbids global imports like `import "./foo.sol"`.
- [`no-restricted-syntax`](/docs/rules/no-restricted-syntax.md): disallows syntax patterns specified with [Slang queries](https://nomicfoundation.github.io/slang/latest/user-guide/06-query-language/01-query-syntax/).
- [`no-send`](/docs/rules/no-send.md): forbids the use of `send` and `transfer` for sending value, in favor of using `call` with value.
- [`no-tx-origin`](/docs/rules/no-tx-origin.md): forbids the use of `tx.origin`.
- [`no-unchecked-calls`](/docs/rules/no-unchecked-calls.md): disallows low-level calls like `call`, `staticcall`, and `delegatecall` that don't use their return values.
- [`no-uninitialized-immutable-references`](/docs/rules/no-uninitialized-immutable-references.md): forbids using immutable references before they are initialized.
- [`no-unused-vars`](/docs/rules/no-unused-vars.md): detects unused variables, imports and functions.
- [`one-contract-per-file`](/docs/rules/one-contract-per-file.md): enforces that a file contains at most one contract/interface/library definition.
- [`private-vars`](/docs/rules/private-vars.md): enforces that all state variables are private.
- [`require-revert-reason`](/docs/rules/require-revert-reason.md): enforces that all reverts have a reason.
- [`sort-imports`](/docs/rules/sort-imports.md): enforces a specific order for import statements.
- [`sort-members`](/docs/rules/sort-members.md): enforces a specific order for top-level elements and contract/interface/library members.
- [`sort-modifiers`](/docs/rules/sort-modifiers.md): enforces a specific order for modifiers.

Don't see a rule you need? [Open an issue](https://github.com/fvictorio/slippy/issues/new).

# Roadmap

What’s next for Slippy:

- IDE support
- Browser build
- Support for plugins
