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
npx slippy contracts/**/*.sol
```

# Why Slippy?

You can read a more detailed [comparison between Slippy and Solhint](/docs/slippy-vs-solhint.md), but here's a summary:

- A single [`naming-convention`](/docs/rules/naming-convention.md) rule
- A more accurate [`no-unused-vars`](/docs/rules/no-unused-vars.md) rule
- Unused comment directives like `// slippy-disable-line` are reported
- No formatting rules
- Semantic versioning

# Configuration

Slippy's configuration lives in a `slippy.config.js` file that exports a configuration object:

```js
module.exports = {
  rules: {
    "explicit-types": "error",
    "max-state-vars": ["warn", 10],
  },
};
```

If your project uses ESM, the content of the file should look like this:

```js
export default {
  rules: {
    "explicit-types": "error",
    "max-state-vars": ["warn", 10],
  },
};
```

# Rules

- [`explicit-types`](/docs/rules/explicit-types.md): enforces or forbids the use of aliases like `uint` instead of `uint256`.
- [`id-denylist`](/docs/rules/id-denylist.md): allows you to specify a list of forbidden identifiers.
- [`imports-on-top`](/docs/rules/imports-on-top.md): enforces that all import statements are at the top of the file.
- [`max-state-vars`](/docs/rules/max-state-vars.md): limits the number of state variables in a contract.
- [`naming-convention`](/docs/rules/naming-convention.md): enforces a naming convention across the codebase.
- [`no-console`](/docs/rules/no-console.md): forbids the use of `console.log` and the import of `console.sol`.
- [`no-default-visibility`](/docs/rules/no-default-visibility.md): forbids the use of default visibility for state variables.
- [`no-duplicate-imports`](/docs/rules/no-duplicate-imports.md): forbids importing the same file multiple times.
- [`no-empty-blocks`](/docs/rules/no-empty-blocks.md): forbids blocks without statements.
- [`no-global-imports`](/docs/rules/no-global-imports.md): forbids global imports like `import "./foo.sol"`.
- [`no-tx-origin`](/docs/rules/no-tx-origin.md): forbids the use of `tx.origin`.
- [`no-uninitialized-immutable-references`](/docs/rules/no-uninitialized-immutable-references.md): forbids using immutable references before they are initialized.
- [`no-unused-vars`](/docs/rules/no-unused-vars.md): detects unused variables, imports and functions.
- [`private-vars`](/docs/rules/private-vars.md): enforces that all state variables are private.
- [`require-revert-reason`](/docs/rules/require-revert-reason.md): enforces that all reverts have a reason.
- [`sort-imports`](/docs/rules/sort-imports.md): enforces a specific order for import statements.
- [`sort-modifiers`](/docs/rules/sort-modifiers.md): enforces a specific order for modifiers.

Don't see a rule you need? [Open an issue](https://github.com/fvictorio/slippy/issues/new).

# Roadmap

What’s next for Slippy:

- Support for an eslint-like flat config, to allow specifying different settings for different folders
- More rules
- Support for plugins
- Browser build
- Autofix
