# named-return-params

Enforces that functions with multiple return parameters use named return parameters.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract A {
  function f() public view returns (uint, address) {}
}
```

Examples of **correct** code for this rule:

```solidity
contract A {
  function f() public view returns (uint x, address a) {}

  function g() public view returns (uint) {}
}
```

## Options

This rule can receive an object option with a `minParams` number field, which specifies the minimum number of return parameters required to trigger the rule. Its default value is `2`. For example, to only trigger the rule for functions with at least 3 return parameters, you can use the following configuration:

```
"named-return-params": ["error", { "minParams": 3 }]
```
