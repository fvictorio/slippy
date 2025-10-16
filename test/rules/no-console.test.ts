import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "no-console";

const fixtures: RuleTestFixture[] = [
  {
    description: "should not report anything when no console is used",
    content: `
    contract A {
      function f() public {
        uint a = 1;
      }
    }
    `,
  },
  {
    description: "should report usage of console.log",
    content: `
    import { console } from "hardhat/console.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    import { console2 } from "forge-std/console2.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    contract A {
      function f() public {
        console.log("hi");
        ^^^^^^^^^^^^^^^^^^
        console2.log("hi");
        ^^^^^^^^^^^^^^^^^^^
        console.logUint(42);
        ^^^^^^^^^^^^^^^^^^^^
      }
    }
    `,
  },
  {
    description: "should warn about console imports from foundry",
    content: `
    import { console } from "forge-std/console.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    import { console2 } from "forge-std/console2.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    import { safeconsole } from "forge-std/safeconsole.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    `,
  },
  {
    description: "should warn about non-remapped console imports from foundry",
    content: `
    import { console } from "forge-std/src/console.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    import { console2 } from "forge-std/src/console2.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    import { safeconsole } from "forge-std/src/safeconsole.sol";
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    `,
  },
  {
    description: "should warn all kinds of console imports",
    content: `
      import "hardhat/console.sol";
      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      import "hardhat/console.sol" as console;
      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      import * as console from "hardhat/console.sol";
      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      import { console } from "hardhat/console.sol";
      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
