import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "id-denylist";

const fixtures: RuleTestFixture[] = [
  {
    description: "should warn on forbidden names for state variables",
    content: `
    contract Foo {
      uint public I;
                  ^
      uint public l;
                  ^
      uint public O;
                  ^
      uint public allowed;
    }
    `,
  },
  {
    description:
      "should warn on forbidden names for contracts, interfaces and libraries",
    content: `
    contract I {}
             ^
    interface l {}
              ^
    library O {}
            ^
    `,
  },
  {
    description: "should warn on forbidden names for structs and enums",
    content: `
    struct I {
           ^
      uint x;
    }
    enum l {
         ^
      A, B, C
    }
    `,
  },
  {
    description: "should warn on forbidden names for functions",
    content: `
    contract Foo {
      function I() public {}
               ^
    }
    `,
  },
  {
    description: "should warn on forbidden names for constants",
    content: `
    uint constant I = 1;
                  ^
    `,
  },
  {
    description: "should warn on forbidden names for modifiers",
    content: `
    contract Foo {
      modifier I() {}
               ^
    }
    `,
  },
  {
    description: "should warn on forbidden names for events",
    content: `
    event I();
          ^
    contract Foo {
      event l();
            ^
    }
    `,
  },
  {
    description: "should warn for user defined value types",
    content: `
    type I is uint;
         ^
    `,
  },
  {
    description: "should warn on forbidden names for errors",
    content: `
    error I();
          ^
    contract Foo {
      error l();
            ^
    }
    `,
  },
  {
    description: "should accept a custom list of forbidden names",
    content: `
    contract Foo {}
             ^^^
    contract I {}
    `,
    config: [["Foo"]],
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
