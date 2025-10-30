# no-hardcoded-gas

Disallows hardcoded gas values in call options.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  function f(C c) public {
    c.g{ gas: 100000 }();
  }
}
```
