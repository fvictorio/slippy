# no-console

Forbids the use of `console.log` and the import of `console.sol`.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
import "hardhat/console.sol";

contract Example {
  function f() public {
    console.log("This should not be used in production");
  }
}
```
