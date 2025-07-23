# max-state-vars

Limits the number of state variables in a contract.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
    uint a1;
    uint a2;
    uint a3;
    uint a4;
    uint a5;
    uint a6;
    uint a7;
    uint a8;
    uint a9;
    uint a10;
    uint a11;
    uint a12;
    uint a13;
    uint a14;
    uint a15;
    uint a16; // This will trigger an error
}
```

## Options

This rule accepts a number option. Its default value is 15. You can customize it by providing your own maximum value:

```
"max-state-vars": ["error", 10]
```
