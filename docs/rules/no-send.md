# no-send

Forbids the use of `send` and `transfer` for sending value, in favor of using `call` with value.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract Example {
  address payable owner;

  function withdrawWithSend(uint amount) public {
    owner.send(amount);
  }

  function withdrawWithTransfer(uint amount) public {
    owner.transfer(amount);
  }
}
```

Examples of **correct** code for this rule:

```solidity
contract Example {
  address payable owner;

  function withdraw(uint amount) public {
    owner.call{ value: amount }("");
  }
}
```
