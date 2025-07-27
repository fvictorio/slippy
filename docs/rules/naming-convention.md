# naming-convention

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

- `constant`
- `immutable`
- `public`
- `internal`
- `private`
- `external`
- `view`
- `pure`
- `payable`
- `virtual`
- `override`
- `abstract`
- `noParameters`
- `hasParameters`

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

### Default config

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
  // unit tests
  {
    selector: "function",
    modifiers: ["noParameters"],
    format: null,
    filter: "^test",
    custom: {
      match: true,
      regex: "^test(Fork)?(_Revert(When|If))?_[A-Za-z0-9]+$",
    },
  },
  // fuzz tests
  {
    selector: "function",
    modifiers: ["hasParameters"],
    format: null,
    filter: "^test",
    custom: {
      match: true,
      regex: "^test(Fork)?Fuzz(_Revert(When|If))?_[A-Za-z0-9]+$",
    },
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
