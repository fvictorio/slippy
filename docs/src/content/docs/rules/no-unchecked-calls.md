---
title: no-unchecked-calls
---

Disallows low-level calls like `call`, `staticcall`, and `delegatecall` that don't use their return values.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  function f(address target, bytes memory data) public {
    target.call(data);
    target.staticcall(data);
    target.delegatecall(data);
    target.call{ value: 1 }(data);
    target.staticcall{ value: 1 }(data);
    target.delegatecall{ value: 1 }(data);
  }
}
```

Examples of **correct** code for this rule:

```solidity
contract Example {
  function f(address target, bytes memory data) public {
    (bool success, bytes memory result) = target.call(data);
    (bool success, bytes memory result) = target.staticcall(data);
    (bool success, bytes memory result) = target.delegatecall(data);
    (bool success, bytes memory result) = target.call{ value: 1 }(data);
    (bool success, bytes memory result) = target.staticcall{ value: 1 }(data);
    (bool success, bytes memory result) = target.delegatecall{ value: 1 }(data);
  }
}
```
