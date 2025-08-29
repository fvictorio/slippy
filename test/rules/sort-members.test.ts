import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "sort-members";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report pragmas after imports",
    content: `
    import "A";
    ^^^^^^^^^^^
    pragma solidity ^0.8.0;
    `,
  },
  {
    description: "should report only one problem",
    content: `
    import "A";
    ^^^^^^^^^^^
    import "B";
    pragma solidity ^0.8.0;
    `,
  },
  {
    description: "should report constructors after functions",
    content: `
    contract A {
      function f() public {}
      ^^^^^^^^^^^^^^^^^^^^^^
      constructor() {}
    }
    `,
  },
  {
    description: "should report one error per source unit and per contract",
    content: `
    import "A";
    ^^^^^^^^^^^
    import "B";
    pragma solidity ^0.8.0;

    contract A {
      function f() public {}
      ^^^^^^^^^^^^^^^^^^^^^^
      function g() public {}
      constructor() {}
    }
    contract B {
      modifier m1() { _; }
      ^^^^^^^^^^^^^^^^^^^^
      modifier m2() { _; }
      uint public x;
    }
    `,
  },
  {
    description: "should check interface and library members",
    content: `
    interface I {
        function f() external;
        ^^^^^^^^^^^^^^^^^^^^^^
        event MyEvent();
    }

    library L {
        function f() public {}
        ^^^^^^^^^^^^^^^^^^^^^^
        event MyEvent();
    }
    `,
  },
  {
    description: "should allow configuring the order of file members",
    content: `
    contract C {}
    enum MyEnum {}
    `,
    config: [{ file: ["ContractDefinition", "EnumDefinition"] }],
  },
  {
    description: "should allow configuring the order of contract members",
    content: `
    contract C {
      modifier m() { _; }

      constructor() {}
    }
    `,
    config: [{ contract: ["ModifierDefinition", "ConstructorDefinition"] }],
  },
  {
    description: "should allow non-exhaustive custom orders",
    content: `
    library L1 {}
    interface I {}
    contract C {}
    library L2 {}
    `,
    config: [{ file: ["InterfaceDefinition", "ContractDefinition"] }],
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
