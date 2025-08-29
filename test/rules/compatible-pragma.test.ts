import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "compatible-pragma";

const fixtures: RuleTestFixture[] = [
  {
    description:
      "should report an issue if the pragma is not compatible with a feature in the file",
    content: `
    pragma solidity ^0.8.0;
    
    error MyError();
          ^^^^^^^^^
    `,
  },
  {
    description:
      "should not report an error if the pragma is compatible with a feature in the file",
    content: `
    pragma solidity ^0.8.22;
    
    error MyError();
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
