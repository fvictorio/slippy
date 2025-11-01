---
title: no-unused-vars
---

Detects unused variables, imports and functions.

## Rule details

This rule will warn you about:

- Unused local variables or parameters.
- Unused named imports.
- Unused private state variables.
- Unused private functions.

This rule will **not** warn you about:

- Unused public, external or internal functions.
- Unused public or internal state variables.
- Unused [global imports](/docs/rules/no-global-imports.md).
- Unused named return parameters.

Examples of **incorrect** code for this rule:

```solidity
import { UnusedNamedImport } from "./Unused.sol";

contract Example {
  uint private unusedPrivateStateVar;

  function unusedPrivateFunction(uint unusedParam) private {
    uint unusedLocalVar;
  }
}
```

Examples of **correct** code for this rule:

```solidity
import "./UnusedGlobalImport.sol";

contract Example {
  uint public unusedPublicStateVar;

  function unusedPublicFunction() public view returns (uint unusedReturnParam) {
    return 1;
  }
}
```

## Options

This rule can receive an object option with an `ignorePattern` string field, which is a regular expression that matches identifiers to ignore.

For example, to ignore all identifiers that start with an underscore, you can do:

```
"no-unused-vars": [
  "error",
  {
    "ignorePattern": "^_"
  }
]
```
