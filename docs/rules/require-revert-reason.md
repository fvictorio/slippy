# require-revert-reason

Enforces that all reverts have a reason.

## Rule details

By default this rule will warn you about `require`s and `revert`s that don't have a revert reason. It's also possible to force revert reasons to be strings or custom errors, by using the `"string"` or `"customError"` options.

Examples of **incorrect** code for this rule:

```solidity
contract Example {
    function f() public {
        revert();
        require(false);
    }
}
```

Examples of **correct** code for this rule:

```solidity
contract Example {
    error MyError();

    function f() public {
        revert("reason string");
        revert MyError();

        require(false, "reason string");
        require(false, MyError());
    }
}
```

## Options

This rule has a string option:

- `"string"` requires that revert reasons be strings.
- `"customError"` requires that revert reasons be custom errors.
- `"any"` (default) allows both strings and errors.

For example, you can configure the rule to require revert reasons to be strings like this:

```
"require-revert-reason": ["error", "string"]
```
