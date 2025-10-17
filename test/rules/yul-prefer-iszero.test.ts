import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "yul-prefer-iszero";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report usages of eq(*, 0) and eq(0, *)",
    content: `
    contract A {
      function f(uint a) public {
        uint x;

        assembly {
          x := eq(a, 0)
               ^^^^^^^^
          x := eq(0, a)
               ^^^^^^^^
          x := eq(mload(0x0), 0)
               ^^^^^^^^^^^^^^^^^
          x := eq(0, mload(0x0))
               ^^^^^^^^^^^^^^^^^
        }
      }
    }
    `,
  },
  {
    description: "shouldn't report matches at the solidity level",
    content: `
    contract A {
      function f(uint a) public {
        eq(a, 0);
        eq(0, a);
      }
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
