---
title: no-duplicate-imports
---

Forbids importing the same file multiple times.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
import { A } from "./foo.sol";
import { B } from "./foo.sol";
```
