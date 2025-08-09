import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "require-revert-reason";

const fixtures: RuleTestFixture[] = [
  {
    description:
      "should report usages of require or revert without a revert reason",
    content: `
    contract A {
        error MyError();
        
        function f() public {
            require(false);
            ^^^^^^^^^^^^^^
            require(false, "reason");
            require(false, MyError());

            revert();
            ^^^^^^^^

            revert("reason");
            revert MyError();
        }
    }
    `,
  },
  {
    description: "should report requires that use a string instead of an error",
    content: `
    contract A {
        function f() public {
            require(false, "reason");
            ^^^^^^^^^^^^^^^^^^^^^^^^
        }
    }
    `,
    config: ["customError"],
  },
  {
    description: "should report requires that use an error instead of a string",
    content: `
    contract A {
        error MyError();

        function f() public {
            require(false, MyError());
            ^^^^^^^^^^^^^^^^^^^^^^^^^
        }
    }
    `,
    config: ["string"],
  },
  {
    description: "should report reverts that use a string instead of an error",
    content: `
    contract A {
        function f() public {
            revert("reason");
            ^^^^^^^^^^^^^^^^
        }
    }
    `,
    config: ["customError"],
  },
  {
    description: "should report reverts that use an error instead of a string",
    content: `
    contract A {
        error MyError();

        function f() public {
            revert MyError();
            ^^^^^^^^^^^^^^^^
        }
    }
    `,
    config: ["string"],
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
