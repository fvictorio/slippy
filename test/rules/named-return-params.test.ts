import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "named-return-params";

const fixtures: RuleTestFixture[] = [
  {
    description:
      "should report unnamed return parameters if there are two or more",
    content: `
    contract A {
      function f() public view returns(uint) {}
      function g() public view returns(
        uint,
        ^^^^
        address
        ^^^^^^^
      ) {}
      function h() public view returns(uint x, address, bool b) {}
                                               ^^^^^^^
    }
    `,
  },
  {
    description: "should take the min params option into account",
    content: `
    contract A {
      function f() public view returns(uint) {}
      function g() public view returns(uint, address) {}
      function h() public view returns(uint x, address, bool b) {}
                                               ^^^^^^^
    }
    `,
    config: [{ minParams: 3 }],
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
