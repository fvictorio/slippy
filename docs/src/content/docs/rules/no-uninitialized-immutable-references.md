---
title: no-uninitialized-immutable-references
---

Forbids using immutable references before they are initialized.

## Rule details

Non-initialized immutable variables can be used in the declaration of other variables, but their value will be zero. This rule forbids that pattern because it can lead to unexpected behavior.

Examples of **correct** code for this rule:

```solidity
contract Example {
  uint256 internal immutable x = 10;
  uint256 public y = x + 5; // y will be 15
}
```

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  uint256 public y = x + 5; // y will be 5, not 15!
  uint256 internal immutable x = 10;
}
```
