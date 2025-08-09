import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-duplicate-imports";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report duplicate imports",
    content: `
    import "lib.sol";
    import "lib.sol";
    ^^^^^^^^^^^^^^^^^
    `,
  },
  {
    description: "should not report unique imports",
    content: `
    import "lib1.sol";
    import "lib2.sol";
    `,
  },
  {
    description: "should report duplicate named imports",
    content: `
    import { A } from "./foo.sol";
    import { B } from "./foo.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
