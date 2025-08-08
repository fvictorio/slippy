# no-restricted-syntax

Disallow certain syntax patterns using [Slang queries](https://nomicfoundation.github.io/slang/latest/user-guide/06-query-language/01-query-syntax/).

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

You can experiment with Slang queries using [this online playground](https://fvictorio.github.io/slang-playground/).
