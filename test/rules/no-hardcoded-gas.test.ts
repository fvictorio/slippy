import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-hardcoded-gas";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report hardcoded gas values in call options",
    content: `
    contract A {
      function f() public {
        c.g{gas: 10000000}();
                 ^^^^^^^^
        c.g{gas: 0x100000}();
                 ^^^^^^^^
        c.g{gas: someValue}();
      }
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
