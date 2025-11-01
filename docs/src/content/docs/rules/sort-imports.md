---
title: sort-imports
---

Enforces a specific order for import statements.

## Rule details

The enforced order is:

1. Imports of non-relative files (e.g., `import "my-dependency/Foo.sol"`).
2. Imports of relative files outside the current directory (e.g., `import "../Foo.sol"`).
3. Imports of relative files in the current directory (e.g., `import "./Foo.sol"`).

Imports of the same type are sorted alphabetically.

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
