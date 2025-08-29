# sort-members

Enforces a specific order for top-level elements and contract members.

## Rule details

For top-level elements, the enforced order is:

1. Pragma directives
2. Import directives
3. User-defined value type definitions
4. Using for directives
5. Constant definitions
6. Enum definitions
7. Struct definitions
8. Event definitions
9. Error definitions
10. Function definitions
11. Interface definitions
12. Library definitions
13. Contract definitions

For contract members, the enforced order is:

1. User-defined value type definitions
2. Using for directives
3. Enum definitions
4. Struct definitions
5. Event definitions
6. Error definitions
7. State variable definitions
8. Constructor definitions
9. Modifier definitions
10. Function definitions
11. Receive function definitions
12. Fallback function definitions

Examples of **correct** code for this rule:

```solidity
// pragma directives
pragma solidity ^0.8.0;

// import directives
import { exampleImport } from "./Example.sol";

// user-defined value types
type ExampleType is uint256;

// using for directives
using { exampleTypeExtension } for ExampleType global;

// constants
uint constant EXAMPLE_CONSTANT = 3141592;

// enums
enum ExampleEnum {
    FirstValue,
    SecondValue
}

// structs
struct ExampleStruct {
    uint x;
    uint y;
}

// events
event ExampleEvent();

// errors
error ExampleError();

// functions
function exampleFunction() pure returns (bool) {
    return true;
}

// interfaces
interface ExampleInterface {}

// libraries
library ExampleLibrary {}

// contracts
contract ExampleContract {
    // user-defined value types
    type ExampleContractType is uint8;

    // using for directives
    using { exampleContractTypeZero } for ExampleContractType;

    // enums
    enum ExampleContractEnum {
        FirstValue,
        SecondValue
    }

    // structs
    struct ExampleContractStruct {
        uint x;
        uint y;
    }

    // events
    event ExampleContractEvent();

    // errors
    error ExampleContractError();

    // state variables
    uint public x;

    // constructor
    constructor () {}

    // modifiers
    modifier m() { _; }

    // functions
    function f() public {}

    // receive
    receive() external payable {}

    // fallback
    fallback() external {}
}
```
