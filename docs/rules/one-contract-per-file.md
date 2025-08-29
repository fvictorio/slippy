# one-contract-per-file

Enforces that a file contains at most one contract/interface/library definition.

## Rule details

Examples of **incorrect** code for this rule:

```solidity
contract A {}
contract B {}
```

Examples of **correct** code for this rule:

```solidity
contract A {}
```

## Options

The rule can be configured to allow multiple contracts/interfaces/libraries in a single file by specifying an `allow` option in the configuration. The `allow` option is an array of objects, each specifying the maximum number of each type of definition allowed in the file.

For example, to allow one contract and one interface in a file, you can do:

```
"one-contract-per-file": [
  "error",
  {
    "allow": [
      {
        "contracts": 1,
        "interfaces": 1
      }
    ]
  }
]
```
