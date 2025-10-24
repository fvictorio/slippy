# no-unnecessary-else

Disallows `else` blocks following `if` statements that end with a control-flow-terminating statement (`return`, `break`, etc.)

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  function f() public {
    if (condition) {
      return;
    } else {
      something();
    }
  }

  function g() public {
    for (uint i = 0; i < 10; i++) {
      if (condition(i)) {
        break;
      } else {
        something();
      }
    }
  }
}
```

Examples of **correct** code for this rule:

```solidity
contract Example {
  function f() public {
    if (condition) {
      return;
    }

    something();
  }

  function g() public {
    for (uint i = 0; i < 10; i++) {
      if (condition(i)) {
        break;
      }

      something();
    }
  }
}
```
