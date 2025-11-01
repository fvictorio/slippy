---
title: no-restricted-syntax
---

Disallows syntax patterns specified with [Slang queries](https://nomicfoundation.github.io/slang/latest/user-guide/06-query-language/01-query-syntax/).

## Rule details

Examples of **incorrect** code for this rule:

```solidity
// config: [{query: '[ContractDefinition name: ["Foo"]]', message: "Contracts named Foo are not allowed"}]

contract Foo {}
```

## Options

This rule receives an array of objects with two required properties:

- `query`: A [Slang query](https://nomicfoundation.github.io/slang/latest/user-guide/06-query-language/01-query-syntax/) that specifies the syntax pattern to disallow.
- `message`: A string that describes the violation.

You can experiment with Slang queries in [this online playground](https://slippy-lint.github.io/slang-playground/).

## Examples

### Forbid using `block.timestamp`

Suppose you want to disallow the use of `block.timestamp` but there's no Slippy rule for that. You can easily do it yourself with a query:

```js
const blockTimestampQuery = `
[MemberAccessExpression
  operand: [Expression ["block"]]
  member: ["timestamp"]
]
`;

export default {
  rules: {
    "no-restricted-syntax": [
      "error",
      [
        {
          query: blockTimestampQuery,
          message: "Using 'block.timestamp' is not allowed",
        },
      ],
    ],
    // ...other rules...
  },
};
```

### Forbid public state variables

If you wanted to forbid public state variables, you could use a query like this:

```js
const publicStateVariableQuery = `
[StateVariableDefinition [StateVariableAttributes [StateVariableAttribute [PublicKeyword]]]]
`;

export default {
  rules: {
    "no-restricted-syntax": [
      "error",
      [
        {
          query: publicStateVariableQuery,
          message: "Public state variables are not allowed",
        },
      ],
    ],
    // ...other rules...
  },
};
```
