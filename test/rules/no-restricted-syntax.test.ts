import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-restricted-syntax";

const fixtures: RuleTestFixture[] = [
  {
    description: "should work with a single query",
    content: `
    contract Foo {}

    library Lib {}
    ^^^^^^^^^^^^^^
    `,
    config: [
      [
        {
          query: "[LibraryDefinition]",
          message: "Library definitions are not allowed.",
        },
      ],
    ],
  },
  {
    description: "should work with more than one query",
    content: `
    contract Foo {}
    ^^^^^^^^^^^^^^^
    library Foo {}

    contract Bar {
      constructor() payable {}
      ^^^^^^^^^^^^^^^^^^^^^^^^
    }
    `,
    config: [
      [
        {
          query: '[ContractDefinition name: ["Foo"]]',
          message: "Contracts named Foo are not allowed",
        },
        {
          query:
            "[ConstructorDefinition [ConstructorAttributes [ConstructorAttribute [PayableKeyword]]]]",
          message: "Payable constructors are not allowed",
        },
      ],
    ],
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
