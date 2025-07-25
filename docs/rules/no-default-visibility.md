# no-default-visibility

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
