import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-unnecessary-else";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report else after block that ends with return",
    content: `
    contract A {
      function f() public {
        if (true) {
          return;
        } else {
          ^^^^
          something();
        }
      }
    }
    `,
  },
  {
    description:
      "should report else after return statement in if branch without block",
    content: `
    contract A {
      function f() public {
        if (true) return;
        else {
        ^^^^
          something();
        }
      }
    }
    `,
  },
  {
    description: "should work if there are comments after the return statement",
    content: `
    contract A {
      function f() public {
        if (true) {
          return; // line comment
          /* block comment */
        } else {
          ^^^^
          something();
        }
      }
    }
    `,
  },
  {
    description:
      "should work with break, continue, revert, and require false statements",
    content: `
    contract A {
      function withBreakStatement() public {
        for (uint i = 0; i < 10; i++) {
          if (i == 5) {
            break;
          } else {
            ^^^^
            doSomething();
          }
        }
      }

      function withContinueStatement() public {
        for (uint i = 0; i < 10; i++) {
          if (i == 5) {
            continue;
          } else {
            ^^^^
            doSomething();
          }
        }
      }

      function withRevertStringStatement() public {
        if (true) {
          revert("Error");
        } else {
          ^^^^
          doSomething();
        }
      }

      function withRevertErrorStatement() public {
        if (true) {
          revert CustomError();
        } else {
          ^^^^
          doSomething();
        }
      }

      function withRequireFalseWithoutMessageStatement() public {
        if (true) {
          require(false);
        } else {
          ^^^^
          doSomething();
        }
      }
      
      function withRequireFalseWithMessageStatement() public {
        if (true) {
          require(false, "Error");
        } else {
          ^^^^
          doSomething();
        }
      }
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
