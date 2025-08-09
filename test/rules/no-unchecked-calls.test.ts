import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-unchecked-calls";

const fixtures: RuleTestFixture[] = [
  {
    description:
      "should report unchecked usages of call, staticcall or delegatecall",
    content: `
    contract A {
      function invalid(address target) public {
        target.call(data);
        ^^^^^^^^^^^^^^^^^^
        target.staticcall(data);
        ^^^^^^^^^^^^^^^^^^^^^^^^
        target.delegatecall(data);
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
        target.call{value: 1}(data);
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        target.staticcall{value: 1}(data);
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        target.delegatecall{value: 1}(data);
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      }

      function valid(address target) public {
        (bool success, bytes memory result) = target.call(data);
        (bool success, bytes memory result) = target.staticcall(data);
        (bool success, bytes memory result) = target.delegatecall(data);
        (bool success, bytes memory result) = target.call{value: 1}(data);
        (bool success, bytes memory result) = target.staticcall{value: 1}(data);
        (bool success, bytes memory result) = target.delegatecall{value: 1}(data);
      }
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
