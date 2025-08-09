import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-uninitialized-immutable-references";

const fixtures: RuleTestFixture[] = [
  {
    description: "should not report a forward reference to a state variable",
    content: `
    contract A {
      uint256 public constA = constB + 100;
      uint256 internal constant constB = 50;
    }
    `,
  },
  {
    description: "should report a reference to an uninitialized immutable",
    content: `
    contract A {
      uint256 public immA = immB + 100;
                            ^^^
      uint256 internal immutable immB = 25;
    }
    `,
  },
  {
    description:
      "should not report a reference to an already initialized immutable",
    content: `
    contract A {
      uint256 internal immutable immD = 75;
      uint256 public immC = immD + 100;
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
