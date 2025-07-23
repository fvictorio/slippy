import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "imports-on-top";

const fixtures: RuleTestFixture[] = [
  {
    description: "should not report anything when imports are on top",
    content: `
    pragma solidity ^0.8.0;

    import "./foo.sol";

    contract A {
      function f() public {
        uint a = 1;
      }
    }
    `,
  },
  {
    description: "should report when an import is not on top",
    content: `
    pragma solidity ^0.8.0;

    contract A {
      function f() public {
        uint a = 1;
      }
    }

    import "./foo.sol";
    ^^^^^^^^^^^^^^^^^^^
    `,
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
