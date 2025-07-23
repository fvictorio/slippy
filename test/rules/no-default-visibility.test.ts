import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-default-visibility";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report state variables with default visibility",
    content: `
      contract A {
        uint256 x1;
        ^^^^^^^^^^
        uint256 public x2;
        uint256 internal x3;
        uint256 private x4;
      }
    `,
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
