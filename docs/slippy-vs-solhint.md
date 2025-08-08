# Slippy vs Solhint

This document explains some of the ways Slippy is different from Solhint.

## Slippy advantages

While Slippy is not feature-complete compared to Solhint yet, it has several advantages over it:

- A **single, flexible configuration** that lets you easily enable or disable rules for specific parts of your codebase.
- A **unified naming rule**, [`naming-convention`](/docs/rules/naming-convention.md), inspired by typescript-eslint's [rule of the same name](https://typescript-eslint.io/rules/naming-convention/). Instead of having to mix and match multiple rules like `const-name-snakecase`, `func-name-mixedcase`, `var-name-mixedcase`, etc., Slippy lets you define a single rule that is as flexible as you need it to be.
- The [`no-unused-vars`](/docs/rules/no-unused-vars.md) rule offers **more accurate detection of unused variables**. It works with local variables, imports, private state variables, and private functions. It also supports an `ignorePattern` option so you can mark variables as intentionally unused (e.g. with a leading underscore).
- Slippy supports inline configuration comments like `// slippy-disable-line`, just like Solhint. But Slippy also **validates that comment directives are effective**: if a comment doesn't do anything, you'll get a warning. This avoids stale comments that only pollute the codebase.
- Slippy **doesn't include any formatting rules**, keeping the focus on code quality and correctness. Instead, you should use [Prettier Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity) to automatically format your code.
- Slippy follows semantic versioning and will never introduce breaking changes in minor releases.

## Slippy limitations

- **Fewer built-in rules**. Not every Solhint rule has a direct equivalent in Slippy. Some of them are easy to add if there's demand. Others will never be added, for various reasons. On the other hand, Slippy already has some rules that are not supported by Solhint, like [`no-uninitialized-immutable-references`](/docs/rules/no-uninitialized-immutable-references.md) or [`curly`](/docs/rules/curly.md). See the [rules comparison](#rules-comparison) below for more details.
- **No autofix**. Slippy doesn't currently support automatic fixing of linting errors, although this is on the roadmap.
- **No plugins**. Adding new functionality through plugins is not supported in Slippy yet.
- **No browser support**. Slippy doesn't have a browser build, but it's designed so that this is easy to add.

## Rules comparison

This section details the differences between Slippy and Solhint rules.

### Solhint rules supported by Slippy

| Solhint rule                      | Slippy equivalent                                               |
| --------------------------------- | --------------------------------------------------------------- |
| `avoid-tx-origin`                 | [`no-tx-origin`](/docs/rules/no-tx-origin.md)                   |
| `const-name-snakecase`            | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `contract-name-capwords`          | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `duplicated-imports`              | [`no-duplicate-imports`](/docs/rules/no-duplicate-imports.md)   |
| `event-name-capwords`             | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `explicit-types`                  | [`explicit-types`](/docs/rules/explicit-types.md)               |
| `foundry-test-functions`          | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `func-name-mixedcase`             | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `func-param-name-mixedcase`       | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `gas-custom-errors`               | [`require-revert-reason`](/docs/rules/require-revert-reason.md) |
| `immutable-vars-naming`           | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `imports-on-top`                  | [`imports-on-top`](/docs/rules/imports-on-top.md)               |
| `imports-order`                   | [`sort-imports`](/docs/rules/sort-imports.md)                   |
| `interface-starts-with-i`         | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `max-states-count`                | [`max-state-vars`](/docs/rules/max-state-vars.md)               |
| `modifier-name-mixedcase`         | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `no-console`                      | [`no-console`](/docs/rules/no-console.md)                       |
| `no-empty-blocks`                 | [`no-empty-blocks`](/docs/rules/no-empty-blocks.md)             |
| `no-global-import`                | [`no-global-imports`](/docs/rules/no-global-imports.md)         |
| `no-unused-import`                | [`no-unused-vars`](/docs/rules/no-unused-vars.md)               |
| `no-unused-vars`                  | [`no-unused-vars`](/docs/rules/no-unused-vars.md)               |
| `private-vars-leading-underscore` | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `reason-string`                   | [`require-revert-reason`](/docs/rules/require-revert-reason.md) |
| `state-visibility`                | [`no-default-visibility`](/docs/rules/no-default-visibility.md) |
| `use-forbidden-name`              | [`id-denylist`](/docs/rules/id-denylist.md)                     |
| `var-name-mixedcase`              | [`naming-convention`](/docs/rules/naming-convention.md)         |
| `visibility-modifier-order`       | [`sort-modifiers`](/docs/rules/sort-modifiers.md)               |

### Slippy rules not supported by Solhint

To the best of my knowledge, the following Slippy rules are not supported by Solhint:

| Slippy rule                                                                                     |
| ----------------------------------------------------------------------------------------------- |
| [`curly`](/docs/rules/curly.md)                                                                 |
| [`no-send`](/docs/rules/no-send.md)                                                             |
| [`no-uninitialized-immutable-references`](/docs/rules/no-uninitialized-immutable-references.md) |

### Solhint rules that will be added to Slippy

These are rules that are not currently supported by Slippy, but that have an open issue for adding them. Please upvote the relevant issue if you want to see it implemented.

| Solhint rule               | GitHub issue                                         |
| -------------------------- | ---------------------------------------------------- |
| `check-send-result`        | [#44](https://github.com/fvictorio/slippy/issues/44) |
| `code-complexity`          | [#41](https://github.com/fvictorio/slippy/issues/41) |
| `comprehensive-interface`  | [#42](https://github.com/fvictorio/slippy/issues/42) |
| `func-named-parameters`    | [#37](https://github.com/fvictorio/slippy/issues/37) |
| `function-max-lines`       | [#40](https://github.com/fvictorio/slippy/issues/40) |
| `gas-named-return-values`  | [#37](https://github.com/fvictorio/slippy/issues/37) |
| `named-parameters-mapping` | [#32](https://github.com/fvictorio/slippy/issues/32) |
| `no-inline-assembly`       | [#43](https://github.com/fvictorio/slippy/issues/43) |
| `one-contract-per-file`    | [#29](https://github.com/fvictorio/slippy/issues/29) |
| `ordering`                 | [#30](https://github.com/fvictorio/slippy/issues/30) |
| `payable-fallback`         | [#39](https://github.com/fvictorio/slippy/issues/39) |
| `use-natspec`              | [#38](https://github.com/fvictorio/slippy/issues/38) |

### Solhint rules that could be added to Slippy

These are rules that I'm not sure about adding, but where I could change my mind. Please [open an issue](https://github.com/fvictorio/slippy/issues/new) if you think one of these should be included.

| Solhint rule              |
| ------------------------- |
| `avoid-call-value`        |
| `avoid-low-level-calls`   |
| `compiler-version`        |
| `gas-calldata-parameters` |
| `gas-increment-by-one`    |
| `gas-indexed-events`      |
| `gas-length-in-loops`     |
| `gas-small-strings`       |
| `gas-strict-inequalities` |
| `gas-struct-packing`      |
| `no-complex-fallback`     |
| `not-rely-on-block-hash`  |
| `not-rely-on-time`        |

### Solhint rules that won't be added to Slippy

These are rules I'm 99% sure won't be added to Slippy. This can be due to being obsolete, out of scope, or because it's unclear if they are useful. If you disagree with any of these, please [open an issue](https://github.com/fvictorio/slippy/issues/new).

| Solhint rule         |
| -------------------- |
| `avoid-sha3`         |
| `avoid-suicide`      |
| `avoid-throw`        |
| `constructor-syntax` |
| `func-visibility`    |
| `gas-multitoken1155` |
| `import-path-check`  |
| `max-line-length`    |
| `quotes`             |
| `reentrancy`         |
| `multiple-sends`     |
