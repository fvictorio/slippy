# sort-modifiers

Enforces a specific order for modifiers.

## Rule details

The enforced order is:

1. Visibility modifiers (`public`, `private`, `internal`, `external`)
2. State mutability modifiers (`pure`, `view`, `payable`)
3. The `virtual` modifier
4. The `override` modifier
5. Custom modifiers

Examples of **correct** code for this rule:

```solidity
contract Example {
  function f() public pure virtual override myModifier {}
}
```

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  function f() public pure virtual override myModifier {}
}
```
