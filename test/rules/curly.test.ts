import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "curly";

const fixtures: RuleTestFixture[] = [
  {
    description:
      "should report if, else, for, while, and do-while statements that are not wrapped in curly braces",
    content: `
    function f() {
      if (foo) qux++;
               ^^^^^^

      while (bar) baz();
                  ^^^^^^

      if (foo) {
        qux++;
      } else
        qux--;
        ^^^^^^
      
      for (uint i = 0; i < 10; i++)
        something();
        ^^^^^^^^^^^^
      
      do something(); while (true);
         ^^^^^^^^^^^^
      
      if (condition) {
          return 1;
      }
      else if (otherCondition) {
          return 2;
      } else {
          return 3;
      }
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
