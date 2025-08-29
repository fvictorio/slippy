# compatible-pragma

Checks that the minimum supported pragma version is compatible with the features used in the file.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
pragma solidity ^0.8.0;

// top-level errors were introduced in solidity 0.8.22
error MyError();
```
