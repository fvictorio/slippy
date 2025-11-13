---
title: sort-imports
---

Enforces a specific order for import statements.

## Rule details

The enforced order is:

1. Imports of non-relative files (e.g., `import "my-dependency/Foo.sol"`).
2. Imports of relative files outside the current directory (e.g., `import "../Foo.sol"`), with those going up more directories coming first.
3. Imports of relative files in the current directory (e.g., `import "./Foo.sol"`).

Imports of the same type are sorted alphabetically, but directories are placed before files. That means that `./a/b/c.sol` will come before `./a/a.sol`, even if the latter is alphabetically first.

Examples of **incorrect** code for this rule:

```solidity
import "../UpperDir.sol";
import "./SameDir.sol";
import "my-dependency/Dep.sol";
```

Examples of **correct** code for this rule:

```solidity
import "my-dependency/Dep.sol";
import "../UpperDir.sol";
import "./SameDir.sol";
```
