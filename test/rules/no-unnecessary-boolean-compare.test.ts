import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-unnecessary-boolean-compare";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report comparisons to true or false",
    content: `
    contract A {
      function f() public {
        if (x == true) {}
            ^^^^^^^^^
        if (x != true) {}
            ^^^^^^^^^
        if (x == false) {}
            ^^^^^^^^^^
        if (x != false) {}
            ^^^^^^^^^^

        if (true == x) {}
            ^^^^^^^^^
        if (true != x) {}
            ^^^^^^^^^
        if (false == x) {}
            ^^^^^^^^^^
        if (false != x) {}
            ^^^^^^^^^^
      }
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
