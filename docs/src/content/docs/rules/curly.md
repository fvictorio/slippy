---
title: curly
---

Enforce the use of curly braces for all control structures.

## Rule details

Examples of **correct** code for this rule:

```solidity
contract Example {
  function foo() public {
    if (condition) {
      bar();
    } else {
      baz();
    }

    for (uint i = 0; i < 10; i++) {
      qux++;
    }

    while (condition) {
      qux--;
    }

    do {
      something();
    } while (condition);
  }
}
```

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  function foo() public {
    if (condition) bar();
    else baz();
  }

  for (uint i = 0; i < 10; i++)
    qux++;

  while (condition)
    qux--;

  do
    something();
  while (condition);
}
```
