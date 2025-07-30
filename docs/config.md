# Configuring Slippy

This document explains how Slippy can be configured using the `slippy.config.js` file and comment directives inside the code.

## Configuration file

Slippy's configuration is defined in a `slippy.config.js` file. This file can export either a single configuration object or an array of configuration objects.

### Minimal example

A minimal configuration file looks like this:

```js
module.exports = {
  rules: {
    "no-console": "warn",
    "no-unused-vars": ["error", { ignorePattern: "^_" }],
  },
};
```

In this example, we are configuring the `no-console` rule to raise warnings and the `no-unused-vars` rule to raise errors, while ignoring unused variables that start with an underscore.

If your project uses ESM, you need to use the `export default` syntax:

```js
export default {
  rules: {
    "no-console": "warn",
    "no-unused-vars": ["error", { ignorePattern: "^_" }],
  },
};
```

### Rule configuration

Rules are configured in the `rules` property of the configuration object. Each rule can be set to one of the following severities:

- `"off"`: Disables the rule.
- `"warn"`: Raises the rule as a warning.
- `"error"`: Raises the rule as an error.

The difference between `"warn"` and `"error"` is that warnings do not fail the linting process, while errors do.

Some rules may also accept options. The configuration for a rule can look like this:

```js
rules: {
  "rule-name": ["severity", { optionKey: optionValue }],
}
```

### Using `files` and `ignores`

You can also specify which files the configuration applies to and which files to ignore. This is useful for applying different rules to different parts of your codebase.

```js
module.exports = {
  files: ["contracts/**/*.sol"],
  ignores: ["contracts/mocks/**/*.sol"],
  rules: {
    // ...your rules...
  },
};
```

Both `files` and `ignores` accept arrays of glob patterns. The `files` property specifies which files the configuration applies to, while the `ignores` property specifies which files to ignore. Slippy uses [micromatch](https://github.com/micromatch/micromatch) under the hood, so you can use any pattern supported by it, including negated patterns.

### Cascading configurations

Instead of exporting a single configuration object, you can export an array of configuration objects. This allows you to apply different configurations to different parts of your codebase.

For example, suppose you want to disallow default visibility for all contracts, but allow it in tests. You can do it like this:

```js
module.exports = [
  {
    rules: {
      "no-console": "warn",
      "no-default-visibility": "error",
    },
  },
  {
    files: ["test/**/*.sol"],
    rules: {
      "no-default-visibility": "off",
    },
  },
];
```

## Comment directives

Slippy supports several comment directives to enable or disable rules directly in the code:

- `// slippy-disable-next-line`: Disables all rules for the next line.
- `// slippy-disable-line`: Disables rules for the current line.
- `// slippy-disable-previous-line`: Disables rules for the previous line.
- `// slippy-disable`: Disables rules until explicitly re-enabled.
- `// slippy-enable`: Re-enables rules after being disabled.

Every comment directive can also specify which rules to disable or enable. For example:

```solidity
function myFunction() {
  // slippy-disable-next-line no-unused-vars
  uint256 unusedVariable; // This variable will not trigger a warning
}
```

Slippy will report unused directives, ensuring that comments that have no effect are not left in the codebase.
