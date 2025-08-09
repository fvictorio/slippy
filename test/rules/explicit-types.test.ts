import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "explicit-types";

const fixtures: RuleTestFixture[] = [
  {
    description:
      "should report usages of implicit types when rule is set to always",
    content: `
    contract A {
      uint public a;
      ^^^^
      int public b;
      ^^^
      ufixed public c;
      ^^^^^^
      fixed public d;
      ^^^^^
    }
    `,
    config: ["always"],
  },
  {
    description:
      "should report usages of explicit types when rule is set to never",
    content: `
    contract A {
      uint256 public a;
      ^^^^^^^
      int256 public b;
      ^^^^^^
      ufixed256x18 public c;
      ^^^^^^^^^^^^
      fixed128x18 public d;
      ^^^^^^^^^^^
    }
    `,
    config: ["never"],
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
