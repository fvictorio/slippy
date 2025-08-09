import { describe } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";

const ruleName = "max-state-vars";

const fixtures: RuleTestFixture[] = [
  {
    description:
      "should not report anything if the contract has less than 15 state variables",
    content: `
    contract A {
      uint x;
      uint y;
    }
    `,
  },
  {
    description:
      "should not report anything if the contract has exactly 15 state variables",
    content: `
    contract A {
      uint x01;
      uint x02;
      uint x03;
      uint x04;
      uint x05;
      uint x06;
      uint x07;
      uint x08;
      uint x09;
      uint x10;
      uint x11;
      uint x12;
      uint x13;
      uint x14;
      uint x15;
    }
    `,
  },
  {
    description:
      "should report a warning if the contract has more than 15 state variables",
    content: `
    contract A {
             ^
      uint x01;
      uint x02;
      uint x03;
      uint x04;
      uint x05;
      uint x06;
      uint x07;
      uint x08;
      uint x09;
      uint x10;
      uint x11;
      uint x12;
      uint x13;
      uint x14;
      uint x15;
      uint x16;
    }
    `,
  },
  {
    description:
      "should report a warning for each contract that has more than 15 state variables",
    content: `
    contract A {
             ^
      uint x1;
      uint x2;
      uint x3;
      uint x4;
      uint x5;
      uint x6;
      uint x7;
      uint x8;
      uint x9;
      uint x10;
      uint x11;
      uint x12;
      uint x13;
      uint x14;
      uint x15;
      uint x16;
    }

    contract B {
             ^
      uint y1;
      uint y2;
      uint y3;
      uint y4;
      uint y5;
      uint y6;
      uint y7;
      uint y8;
      uint y9;
      uint y10;
      uint y11;
      uint y12;
      uint y13;
      uint y14;
      uint y15;
      uint y16;
    }
    `,
  },
  {
    description: "should use the configured maximum number of state variables",
    content: `
    contract A {
             ^
      uint x1;
      uint x2;
      uint x3;
      uint x4;
      uint x5;
      uint x6;
      uint x7;
      uint x8;
      uint x9;
      uint x10;
      uint x11;
    }
    `,
    config: [10],
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
