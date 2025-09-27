import { describe, expect, it } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";
import { Linter } from "../../src/linter.js";
import { mockSingleRuleConfigLoader } from "../helpers/config.js";

const ruleName = "one-contract-per-file";

const fixtures: RuleTestFixture[] = [
  {
    description: "should accept empty files",
    content: ``,
  },
  {
    description: "should accept a single contract per file by default",
    content: `
      contract A {}
    `,
  },
  {
    description: "should accept a single library per file by default",
    content: `
      library A {}
    `,
  },
  {
    description: "should accept a single interface per file by default",
    content: `
      interface A {}
    `,
  },
  {
    description: "should report a file with two contracts",
    content: `
      contract A {}
      contract B {}
      ^^^^^^^^^^^^^
    `,
  },
  {
    description: "should report a file with one library and one interface",
    content: `
      interface I {}
      library L {}
      ^^^^^^^^^^^^
    `,
  },
  {
    description: "should accept a config",
    content: `
      contract C {}
      interface I {}
    `,
    config: [
      {
        allow: [{ contracts: 1, interfaces: 1 }],
      },
    ],
  },
  {
    description: "should report when the config is exceeded",
    content: `
      contract C {}
      interface I {}
      interface I2 {}
      ^^^^^^^^^^^^^^^
    `,
    config: [
      {
        allow: [{ contracts: 1, interfaces: 1 }],
      },
    ],
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);

  it("should print the right error message (1C, 1I, 1L)", async () => {
    const linter = new Linter(mockSingleRuleConfigLoader(ruleName));

    const { diagnostics } = await linter.lintText(
      `
      contract C {}
      interface I {}
      library L {}
      `,
      "contract.sol",
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toMatchInlineSnapshot(
      `"The file has 1 contract, 1 interface, and 1 library, which is not allowed"`,
    );
  });

  it("should print the right error message (2I)", async () => {
    const linter = new Linter(mockSingleRuleConfigLoader(ruleName));

    const { diagnostics } = await linter.lintText(
      `
      interface I1 {}
      interface I2 {}
      `,
      "contract.sol",
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toMatchInlineSnapshot(
      `"The file has 2 interfaces, which is not allowed"`,
    );
  });

  it("should print the right error message (3C)", async () => {
    const linter = new Linter(mockSingleRuleConfigLoader(ruleName));

    const { diagnostics } = await linter.lintText(
      `
      contract C1 {}
      contract C2 {}
      contract C3 {}
      `,
      "contract.sol",
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toMatchInlineSnapshot(
      `"The file has 3 contracts, which is not allowed"`,
    );
  });
});
