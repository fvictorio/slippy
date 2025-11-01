---
title: imports-on-top
---

Enforces that all import statements are at the top of the file.

## Rule details

Examples of **correct** code for this rule:

```solidity
import "path/to/contract.sol";

contract Example {}
```

Examples of **incorrect** code for this rule:

```solidity
contract Example {}

import "path/to/contract.sol";
```
