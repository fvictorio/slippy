# no-unnecessary-boolean-compare

Forbids unnecessary comparisons to boolean literals.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  function f(bool b1, bool b2) public {
    require(b1 == true);
    require(b2 == false);
  }
}
```

Examples of **correct** code for this rule:

```solidity
contract Example {
  function f(bool b1, bool b2) public {
    require(b1);
    require(!b2);
  }
}
```
