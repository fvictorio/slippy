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
  {
    description:
      "shouldn't warn about transfers that have more than one argument",
    content: `
      contract Example {
        address payable owner;

        function withdraw(IERC20 token, uint amount) public {
          token.transfer(owner, amount);
        }
      }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
