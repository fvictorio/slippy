# id-denylist

Allows you to specify a list of forbidden identifiers.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  uint public I;
  uint public l;
  uint public O;
}
```

## Options

This rule has an array option. By default, the following identifiers are disallowed: `["I", "l", "O"]`.

You can customize the list of disallowed identifiers by providing your own array of strings:

```
"id-denylist": ["error", ["I", "l", "O", "zero", "one", "two"]]
```
