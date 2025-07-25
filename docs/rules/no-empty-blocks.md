# no-empty-blocks

Forbids blocks without statements.

## Rule details

Examples of **correct** code for this rule:

```solidity
contract Example {
    constructor() Base() {}

    function someFunction() public {
        someStatement();
    }

    function functionWithComment() public {
        // if a block contains only comments, it is still considered non-empty
    }

    // virtual functions can have empty bodies
    function virtualFunction() public virtual {}

    // fallback and receive functions can be empty
    fallback() external {}
    receive() external payable {}
}
```

Examples of **incorrect** code for this rule:

```solidity
contract EmptyContract {}

contract Example {
    constructor() {}

    function someEmptyFunction() public {
    }

    function emptyIfStatement() public {
        if (true) {}
    }
}
```
