import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-tx-origin";

const fixtures: RuleTestFixture[] = [
  {
    description: "should not report anything when tx.origin is not used",
    content: `
      contract A {
        function f() public {
          address a = msg.sender;
        }
      }
    `,
  },
  {
    description: "should report usage of tx.origin",
    content: `
      contract A {
        function f() public {
          address a = tx.origin;
                      ^^^^^^^^^
        }
      }
    `,
  },
  {
    description: "should report multiple usages of tx.origin",
    content: `
      contract A {
        function f() public {
          address a = tx.origin;
                      ^^^^^^^^^
          address b = tx.origin;
                      ^^^^^^^^^
        }
      }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
