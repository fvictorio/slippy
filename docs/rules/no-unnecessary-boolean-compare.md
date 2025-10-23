# no-unnecessary-boolean-compare

Forbids unnecessary comparisons to boolean literals.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
import "hardhat/console.sol";

contract Example {
  function f(bool b) public {
    require(b == true);
    require(b != false);
  }
}
```
