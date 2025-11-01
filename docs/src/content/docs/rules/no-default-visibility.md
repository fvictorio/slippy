---
title: no-default-visibility
---

> 🔧 Problems reported by this rule can be automatically fixed by using the `--fix` flag

Forbids the use of default visibility for state variables

## Rule details

Examples of **correct** code for this rule:

```solidity
contract Example {
  uint256 public value;
}
```

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  uint256 value;
}
```
