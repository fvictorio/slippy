---
title: private-vars
---

Enforces that all state variables are private.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  uint public x;
  uint internal y;
}
```

Examples of **correct** code for this rule:

```solidity
contract Example {
  uint private x;
  uint private y;
}
```
