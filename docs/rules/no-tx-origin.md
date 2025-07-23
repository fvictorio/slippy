# no-tx-origin

Forbids the use of `tx.origin`.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
    address public owner;

    constructor() {
        owner = tx.origin;
    }
}
```
