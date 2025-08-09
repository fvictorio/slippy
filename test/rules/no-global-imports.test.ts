import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-global-imports";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report global imports",
    content: `
    import "foo";
    ^^^^^^^^^^^^^
    import "bar";
    ^^^^^^^^^^^^^
    import { baz } from "baz";
    import "qux" as qux;
    import * as quux from "quux";
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
