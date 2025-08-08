import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-send";

const fixtures: RuleTestFixture[] = [
  {
    description: "forbid using send",
    content: `
      contract Example {
        address payable owner;

        function withdraw(uint amount) public {
          owner.send(amount);
          ^^^^^^^^^^^^^^^^^^
        }
      }
    `,
  },
  {
    description: "forbid using transfer",
    content: `
      contract Example {
        address payable owner;

        function withdraw(uint amount) public {
          owner.transfer(amount);
          ^^^^^^^^^^^^^^^^^^^^^^
        }
      }
    `,
  },
  {
    description: "allow using call with value",
    content: `
      contract Example {
        address payable owner;

        function withdraw(uint amount) public {
          owner.call{value: amount}("");
        }
      }
    `,
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
