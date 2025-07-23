import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "private-vars";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report non-private state variables",
    content: `
    contract A {
      uint public pu;
                  ^^
      uint internal i;
                    ^
      uint private pr;
      uint immutable im = 1;
      uint constant co = 2;
    }
    `,
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
