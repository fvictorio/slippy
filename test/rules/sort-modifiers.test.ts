import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "sort-modifiers";

const fixtures: RuleTestFixture[] = [
  {
    description: "should accept modifiers in the right order",
    content: `
        contract Foo {
          function f() public pure virtual override m1 m2 {}
        }
      `,
  },
  {
    description: "should report mutability before visibility",
    content: `
    contract Foo {
      function f() pure public {}
                   ^^^^
    }
    `,
  },
  {
    description: "should report virtual before visibility",
    content: `
    contract Foo {
      function f() virtual public {}
                   ^^^^^^^
    }
    `,
  },
  {
    description: "should report override before visibility",
    content: `
    contract Foo {
      function f() override public m1 m2 {}
                   ^^^^^^^^
    }
    `,
  },
  {
    description: "should report custom modifier before visibility",
    content: `
    contract Foo {
      function f() m1 public {}
                   ^^
    }
    `,
  },
  {
    description: "should report virtual before mutability",
    content: `
    contract Foo {
      function f() virtual pure {}
                   ^^^^^^^
    }
    `,
  },
  {
    description: "should report override before mutability",
    content: `
    contract Foo {
      function f() override pure {}
                   ^^^^^^^^
    }
    `,
  },
  {
    description: "should report custom before mutability",
    content: `
    contract Foo {
      function f() m1 pure {}
                   ^^
    }
    `,
  },
  {
    description: "should report override before virtual",
    content: `
    contract Foo {
      function f() override virtual {}
                   ^^^^^^^^
    }
    `,
  },
  {
    description: "should report custom before virtual",
    content: `
    contract Foo {
      function f() m1 virtual {}
                   ^^
    }
    `,
  },
  {
    description: "should report custom before override",
    content: `
    contract Foo {
      function f() m1 override {}
                   ^^
    }
    `,
  },
  {
    description: "should only report one modifier order error",
    content: `
    contract Foo {
      function f() m1 override virtual pure public {}
                                       ^^^^
    }
    `,
  },
  {
    description: "should report constant before visibility",
    content: `
    contract Foo {
      uint constant public x = 1;
           ^^^^^^^^
      uint public constant y = 1;
    }
    `,
  },
  {
    description: "should report immutable before visibility",
    content: `
    contract Foo {
      uint immutable private x = 1;
           ^^^^^^^^^
      uint private immutable y = 1;
    }
    `,
  },
  {
    description: "should report transient before visibility",
    content: `
    contract Foo {
      uint transient internal x;
           ^^^^^^^^^
      uint internal transient y;
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
