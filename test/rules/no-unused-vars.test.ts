import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-unused-vars";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report an error for an unused local variable",
    content: `
        contract A {
          function f() public {
            uint x;
                 ^
          }
        }
      `,
  },
  {
    description: "should report two errors for two unused local variables",
    content: `
        contract A {
          function f() public {
            uint x;
                 ^
            uint y;
                 ^
          }
        }
      `,
  },
  {
    description: "should not report an error for a variable that is assigned",
    content: `
        contract A {
          function f() public {
            uint x;

            x = 1;
          }
        }
      `,
  },
  {
    description:
      "should not report an error for a variable that is used in a function call",
    content: `
        contract A {
          function f() public {
            uint x;

            f(x);
          }
        }
      `,
  },
  {
    description: "should report an error for an unused parameter",
    content: `
        contract A {
          function f(uint x) public {y++;}
                          ^
        }
      `,
  },
  {
    description: "should not report an error for an used parameter",
    content: `
        contract A {
          function f(uint x) public {y = x;}
        }
      `,
  },
  {
    description:
      "should not report an error for an unused parameter in a function with an empty block",
    content: `
        contract A {
            function f(uint x) public {}

            function g() public {
              x++;
            }
        }
      `,
  },
  {
    description: "should report an error for an unused private variable",
    content: `
        contract A {
            uint private x;
                         ^
            uint private y;

            function incY() public {y++;}
        }
      `,
  },
  {
    description: "should ignore named keys in mappings",
    content: `
contract Foo {
  mapping(uint x => uint) private m1;
  mapping(uint => uint y) private m2;
  mapping(uint x => uint y) private m3;
  mapping(uint x => mapping(uint y => uint z)) private m4;

  function add(uint x, uint y) public {
    m1[x] = y;
    m2[x] = y;
    m3[x] = y;
    m4[x][y] = 0;

    mapping(uint x => uint y) storage m5;
    m5[0] = [0];
  }
}
      `,
  },
  {
    description: "shouldn't report unused named return parameters",
    content: `
contract Foo {
  function f() public returns (uint y) {
    x++;
  }
  function g() public returns (uint y, uint z) {
    x++;
  }
}
      `,
  },
  {
    description: "should report an unused private function",
    content: `
        contract A {
          function f() private {}
          function g() private {}
                   ^
          function h() public {
            f();
          }
        }
      `,
  },
  {
    description:
      "shouldn't report function parameters that are used in a modifier",
    content: `
      contract A {
        function f(uint x) public myModifier(x) {
          y++;
        }
      }
    `,
  },
  {
    description: "should report unused import values",
    content: `
      import * as UsedNamedImport from "./UsedNamedImport.sol";
      import * as UnusedNamedImport from "./UnusedNamedImport.sol";
                  ^^^^^^^^^^^^^^^^^

      import "./UsedPathImport.sol" as UsedPathImport;
      import "./UnusedPathImport.sol" as UnusedPathImport;
                                         ^^^^^^^^^^^^^^^^
                                        
      import {
        Used,
        Unused,
        ^^^^^^
        OriginalUsed as AliasedUsed,
        OriginalUnused as AliasedUnused
                          ^^^^^^^^^^^^^
      } from "./ImportDeconstruction.sol";

      contract A is UsedNamedImport {
        UsedPathImport.Something public usedPathImport;
        Used public used;
        AliasedUsed public aliasedUsed;
      }
    `,
  },
  {
    description: "should respect the ignorePattern option",
    content: `
      import * as _UnusedNamedImport from "./UnusedNamedImport.sol";

      contract A {
        function f(uint _unusedParam) public {
          uint _unusedVariable;
        }

        function _unusedFunction() private {}
      }
    `,
    config: [{ ignorePattern: "^_" }],
  },
  {
    description:
      "should not report variables used in tuple deconstruction statements",
    content: `
      contract A {
          function f() public {
              uint x;
              uint y;
              (x, y) = (1, 2);
          }
      }
    `,
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
