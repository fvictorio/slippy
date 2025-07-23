# Slippy vs Solhint

This document explains some of the ways Slippy is different from Solhint.

## Flexible naming convention rule

Slippy includes a [`naming-convention`](docs/rules/naming-convention.md) rule inspired by typescript-eslint's [rule of the same name](https://typescript-eslint.io/rules/naming-convention/). You can enforce any naming pattern you want, including different styles for functions, constants, variables, and more.

## More accurate unused checks

The [`no-unused-vars`](docs/rules/no-unused-vars.md) rule in Slippy is very thorough. It detects unused variables, imports, private state variables, and private functions. It also supports an `ignorePattern` option so you can mark variables as intentionally unused (e.g. with a leading underscore).

## Smarter directive comments

Slippy supports inline comment directives like `// slippy-disable-line`, just like Solhint. But Slippy also validates them: if a directive doesn't do anything, you'll get a warning. This avoids stale comments that only pollute the codebase.

## No formatting rules

Slippy does not include any formatting rules. Use [Prettier Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity) for that.

## Semantic versioning

Slippy will follow semantic versioning and will never introduce breaking changes in minor releases.
