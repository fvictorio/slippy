---
title: naming-convention
---

Enforces a naming convention across the codebase.

## Rule details

By default, this rule enforces the following naming convention:

- Variables, parameters and function names should be in `camelCase`.
- Names of type-like entities like contracts, structs, custom errors, etc., should be in `PascalCase`.
- Enum members should be in `PascalCase`.

Examples of **correct** code for this rule:

```solidity
contract MyContract {
  error MyCustomError(uint256 myErrorParam);

  uint256 myVariable;

  function myFunction(uint256 myFunctionParam) public {
    uint myLocalVariable;
  }
}

enum MyEnum {
  FirstValue,
  SecondValue
}
```

## Options

This rule accepts the same configuration array as typescript-eslint's [naming-convention](https://typescript-eslint.io/rules/naming-convention/) rule, with some differences:

- Selectors and modifiers are adapted for Solidity (see below).
- The `prefix`, `suffix` and `types` options are not supported.

The following selectors are available:

- `contract`
- `interface`
- `library`
- `stateVariable`
- `function`
- `variable`
- `struct`
- `structMember`
- `enum`
- `enumMember`
- `parameter`
- `modifier`
- `event`
- `eventParameter`
- `userDefinedValueType`
- `error`
- `errorParameter`
- `mappingParameter`

The following group selectors are available:

- `default`: matches all identifiers.
- `typeLike`: matches `contract`, `interface`, `library`, `struct`, `enum`, `error`, `event`, and `userDefinedValueType`.
- `variableLike`: matches `stateVariable`, `function`, `variable`, `structMember`, `parameter`, `modifier`, `eventParameter`, `errorParameter`, and `mappingParameter`

The following modifiers are available:

- `constant`: the variable is marked as constant
- `immutable`: the variable is marked as immutable
- `public`: the variable or function is marked as public
- `internal`: the variable or function is marked as internal
- `private`: the variable or function is marked as private
- `external`: the function is marked as external
- `view`: the function is marked as view
- `pure`: the function is marked as pure
- `payable`: the function is marked as payable
- `virtual`: the function is marked as virtual
- `override`: the function overrides a function in a parent contract
- `abstract`: the contract is marked as abstract
- `noParameters`: the function has no parameters
- `hasParameters`: the function has at least one parameter
- `contract`: the function is defined in a contract
- `interface`: the function is defined in an interface
- `library`: the function is defined in a library

For example, the following configuration enforces camelCase for everything except for type-like entities, which should be in PascalCase:

````json5
[
  {
    "selector": "default",
    "format": ["camelCase"],
    "leadingUnderscore": "allow",
    "trailingUnderscore": "allow"
  },
  {
    "selector": "typeLike",
    "format": ["PascalCase"]
  }
]

```js
export default {
  rules: {
    "naming-convention": [
      "error",
      [
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["PascalCase"],
        },
      ],
    ],
  },
};
````

## Example configs

### Simple config

```json5
[
  {
    selector: "default",
    format: ["camelCase"],
    leadingUnderscore: "allow",
    trailingUnderscore: "allow",
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  },
  {
    selector: "enumMember",
    format: ["PascalCase"],
  },
]
```

### Interfaces should start with I

```json
[
  {
    "selector": "interface",
    "format": ["PascalCase"],
    "custom": {
      "match": true,
      "regex": "^I[A-Z]"
    }
  }
]
```

### Constants and immutables should be in UPPER_CASE

```json
[
  {
    "selector": "stateVariable",
    "format": ["UPPER_CASE"],
    "modifiers": ["constant"]
  },
  {
    "selector": "stateVariable",
    "format": ["UPPER_CASE"],
    "modifiers": ["immutable"]
  }
]
```

> ⚠️ A name must match all modifiers in an entry, that's why we need two separate entries for `constant` and `immutable` in the example above.

### Unit tests start with `test_` and fuzz tests start with `testFuzz_`

```js
[
  {
    selector: 'function',
    filter: '^test',
    format: null,
    custom: {
      match: true,
      regex: '^test_',
    },
    modifiers: ['noParameters'],
  },
  {
    selector: 'function',
    filter: '^test',
    format: null,
    custom: {
      match: true,
      regex: '^testFuzz_',
    },
    modifiers: ['hasParameters'],
  },
],
```
