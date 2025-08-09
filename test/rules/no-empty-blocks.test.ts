import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-empty-blocks";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report about empty contracts",
    content: `
    contract Foo {}
                 ^^
             
    contract Bar {     }
                 ^^^^^^^

    contract WithComment {
      // if there's a comment, it's not considered empty
    }

    contract /* comment outside block */ WithCommentOutsideBlock {}
                                                                 ^^
    `,
  },
  {
    description: "should report about empty interfaces",
    content: `
    interface Foo {}
                  ^^
             
    interface Bar {     }
                  ^^^^^^^

    interface WithComment {
      // if there's a comment, it's not considered empty
    }

    interface /* comment outside block */ WithCommentOutsideBlock {}
                                                                  ^^
    `,
  },
  {
    description: "should report about empty libraries",
    content: `
    library Foo {}
                ^^
             
    library Bar {     }
                ^^^^^^^

    library WithComment {
      // if there's a comment, it's not considered empty
    }

    library /* comment outside block */ WithCommentOutsideBlock {}
                                                                ^^
    `,
  },
  {
    description: "should report about empty functions unless they are virtual",
    content: `
    contract Foo {
      function emptyFunction() public {}
                                      ^^
      function emptyFunctionWithComment() public {
        // line comment
      }
      function emptyFunctionWithMultilineComment() public {
        /* multiline comment */
      }
      function emptyVirtualFunction() public virtual {}
    }

    abstract contract AbstractFoo {
      function emptyFunction() public virtual;
    }
    `,
  },
  {
    description: "should report about other kinds of empty blocks",
    content: `
  contract Foo {
    function f() public {
      if (true) {}
                ^^

      while (true) {}
                   ^^

      for (uint i = 0; i < 10; i++) {}
                                    ^^

      do {} while (true);
         ^^


      try this.g() returns (uint x) {}
                                    ^^
      catch {}
            ^^

      assembly {}
               ^^

      unchecked {}
                ^^
    }

    function g() external returns (uint) {
        return 0;
    }
  }
    `,
  },
  {
    description: "should ignore empty constructors with base constructors",
    content: `
    contract Foo {
      constructor() {}
                    ^^
    }
    contract Bar is Foo {
      constructor() Foo() {}
    }

    contract Baz {
      constructor() public {}
                           ^^
    }
    `,
  },
  {
    description: "should ignore fallback and receive functions",
    content: `
    contract Foo {
      fallback() external {}
      receive() external payable {}
    }
    `,
  },
  {
    description: "should ignore empty payable constructors",
    content: `
    contract Foo {
      constructor() payable {}
    }
    `,
  },
  {
    description: "should not ignore empty constructors with public modifier",
    content: `
    contract Foo {
      constructor() public {}
                           ^^
    }
    `,
  },
  {
    description:
      "should ignore empty contracts and interfaces that inherit other contracts",
    content: `
      contract Foo is Bar, Baz {}
      interface IFoo is IBar, IBaz {}
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
