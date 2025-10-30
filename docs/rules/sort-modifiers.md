# sort-modifiers

> 🔧 Problems reported by this rule can be automatically fixed by using the `--fix` flag

Enforces a specific order for functions and state variable modifiers.

## Rule details

The enforced order for functions is:

1. Visibility modifiers (`public`, `private`, `internal`, `external`)
2. State mutability modifiers (`pure`, `view`, `payable`)
3. The `virtual` modifier
4. The `override` modifier
5. Custom modifiers

The enforced order for state variables is:

1. Visibility modifiers (`public`, `private`, `internal`)
2. Storage location (`constant`, `immutable`, `transient`)

Examples of **correct** code for this rule:

```solidity
contract Example {
  uint public constant x = 1;

  function f() public pure virtual override myModifier {}
}
```

Examples of **incorrect** code for this rule:

<!-- prettier-ignore-start -->
```solidity
contract Example {
  uint immutable private x = 1;

  function f() myModifier public pure virtual override {}
}
```
<!-- prettier-ignore-end -->
