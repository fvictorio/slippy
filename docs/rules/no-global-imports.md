# no-global-imports

Forbids global imports like `import "./foo.sol"`.

## Rule details

Examples of **correct** code for this rule:

```solidity
import { A } from "./A.sol";
import * as B from "./B.sol";
import "./C.sol" as C;
```

Examples of **incorrect** code for this rule:

```solidity
import "./A.sol";
import "./B.sol";
```
