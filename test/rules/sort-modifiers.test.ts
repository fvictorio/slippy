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
                        ^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() public pure {}
    }
    `,
  },
  {
    description: "should report virtual before visibility",
    content: `
    contract Foo {
      function f() virtual public {}
                           ^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() public virtual {}
    }
    `,
  },
  {
    description: "should report override before visibility",
    content: `
    contract Foo {
      function f() override public m1 m2 {}
                            ^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() public override m1 m2 {}
    }
    `,
  },
  {
    description: "should report custom modifier before visibility",
    content: `
    contract Foo {
      function f() m1 public {}
                      ^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() public m1 {}
    }
    `,
  },
  {
    description: "should report virtual before mutability",
    content: `
    contract Foo {
      function f() virtual pure {}
                           ^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() pure virtual {}
    }
    `,
  },
  {
    description: "should report override before mutability",
    content: `
    contract Foo {
      function f() override pure {}
                            ^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() pure override {}
    }
    `,
  },
  {
    description: "should report custom before mutability",
    content: `
    contract Foo {
      function f() m1 pure {}
                      ^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() pure m1 {}
    }
    `,
  },
  {
    description: "should report override before virtual",
    content: `
    contract Foo {
      function f() override virtual {}
                            ^^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() virtual override {}
    }
    `,
  },
  {
    description: "should report custom before virtual",
    content: `
    contract Foo {
      function f() m1 virtual {}
                      ^^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() virtual m1 {}
    }
    `,
  },
  {
    description: "should report custom before override",
    content: `
    contract Foo {
      function f() m1 override {}
                      ^^^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() override m1 {}
    }
    `,
  },
  {
    description: "should only report one modifier order error",
    content: `
    contract Foo {
      function f() m1 override virtual pure public {}
                                            ^^^^^^
    }
    `,
    fixed: `
    contract Foo {
      function f() public pure virtual override m1 {}
    }
    `,
  },
  {
    description: "should report constant before visibility",
    content: `
    contract Foo {
      uint constant public x = 1;
                    ^^^^^^
      uint public constant y = 1;
    }
    `,
    fixed: `
    contract Foo {
      uint public constant x = 1;
      uint public constant y = 1;
    }
    `,
  },
  {
    description: "should report immutable before visibility",
    content: `
    contract Foo {
      uint immutable private x = 1;
                     ^^^^^^^
      uint private immutable y = 1;
    }
    `,
    fixed: `
    contract Foo {
      uint private immutable x = 1;
      uint private immutable y = 1;
    }
    `,
  },
  {
    description: "should report transient before visibility",
    content: `
    contract Foo {
      uint transient internal x;
                     ^^^^^^^^
      uint internal transient y;
    }
    `,
    fixed: `
    contract Foo {
      uint internal transient x;
      uint internal transient y;
    }
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
