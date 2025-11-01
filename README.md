# Slippy

[Docs](https://slippy-lint.github.io/slippy)

Slippy is a linter for Solidity that's simple, powerful, and thoughtfully built.

## Installation

Install it:

```bash
npm install --save-dev slippy
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

You can read a more detailed [comparison between Slippy and Solhint](https://slippy-lint.github.io/slippy/guides/slippy-vs-solhint), but here's a summary:

- A single, flexible configuration that lets you easily enable or disable rules for specific parts of your codebase
- A unified [`naming-convention`](https://slippy-lint.github.io/slippy/rules/naming-convention) rule
- A more accurate [`no-unused-vars`](https://slippy-lint.github.io/slippy/rules/no-unused-vars) rule
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

For more details on configuring Slippy, including advanced features like cascading configurations, file ignores, and comment directives, see the [configuration documentation](https://slippy-lint.github.io/guides/configuration).

# Rules

You can find the full list of available rules in the [rules reference documentation](https://slippy-lint.github.io/slippy/reference/rules).
