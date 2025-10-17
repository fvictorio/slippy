# yul-prefer-iszero

Recommends using `iszero` instead of `eq` when comparing to the `0` literal in Yul code.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract A {
  function f(uint a) public {
    uint x;

    assembly {
      x := eq(a, 0)
      x := eq(0, a)
    }
  }
}
```

Examples of **correct** code for this rule:

```solidity
contract A {
  function f(uint a) public {
    uint x;

    assembly {
      x := iszero(a)
    }
  }
}
```
