# explicit-types

Enforces or forbids the use of aliases like `uint` instead of `uint256`.

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
    uint public value;
}
```

## Options

This rule has a string option:

- `"always"` (default) enforces the use of explicit types.
- `"never"` forbids the use of explicit types.
