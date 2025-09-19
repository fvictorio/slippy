import { describe, expect, it } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";
import { compareImportPaths } from "../../src/rules/sort-imports.js";
import { Linter } from "../../src/linter.js";
import { mockSingleRuleConfigLoader } from "../helpers/config.js";

const ruleName = "sort-imports";

const fixtures: RuleTestFixture[] = [
  {
    description: "should report libraries in the wrong order",
    content: `
    import { B } from "b";
                      ^^^
    import { A } from "a";
    `,
  },
  {
    description: "should not report a set of imports in the correct order",
    content: `
    import "a";
    import "b";
    import "../../c.sol";
    import "../d.sol";
    import "./e.sol";
    `,
  },
  {
    description: "Issue #78: directories should come before files",
    content: `
    import { NonFungibleTokenEnumerable } from './enumerable/NonFungibleTokenEnumerable.sol';
    import { _NonFungibleTokenMetadata } from './metadata/_NonFungibleTokenMetadata.sol';
    import { NonFungibleTokenMetadata } from './metadata/NonFungibleTokenMetadata.sol';
    import { _NonFungibleToken } from './_NonFungibleToken.sol';
    import { _SolidstateNonFungibleToken } from './_SolidstateNonFungibleToken.sol';
    import { ISolidstateNonFungibleToken } from './ISolidstateNonFungibleToken.sol';
    import { NonFungibleToken } from './NonFungibleToken.sol';
    `,
  },
  {
    description: "Issue #78: paths further up the tree should come first",
    content: `
    import { _IERC4626 } from '../../../interfaces/_IERC4626.sol';
    import { _IFungibleTokenMetadata } from '../metadata/_IFungibleTokenMetadata.sol';
    import { _IFungibleToken } from '../_IFungibleToken.sol';
    `,
  },
];

describe(ruleName, () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);

  it("should show the correct position of the import", async () => {
    const linter = new Linter(mockSingleRuleConfigLoader(ruleName));

    const results = await linter.lintText(
      `
import "D";
import "A";
import "B";
import "C";
      `,
      "contract.sol",
    );

    expect(results).toHaveLength(1);
    expect(results[0].message).toBe(
      `Import of "D" should come after import of "C"`,
    );
  });
});

describe("compareImportPaths", () => {
  it("should sort non-relative paths correctly", () => {
    expect(compareImportPaths("a", "b")).toBe(-1);
    expect(compareImportPaths("b", "a")).toBe(1);
    expect(compareImportPaths("a", "a")).toBe(0);

    expect(compareImportPaths("a/b", "a/c")).toBe(-1);
    expect(compareImportPaths("a/b", "a/bb")).toBe(-1);
    expect(compareImportPaths("aa/a", "b/bb")).toBe(-1);
  });

  it("should put relative paths after non-relative paths", () => {
    expect(compareImportPaths("a", "./b")).toBe(-1);
    expect(compareImportPaths("./b", "a")).toBe(1);
    expect(compareImportPaths("a/b", "./c/d")).toBe(-1);
    expect(compareImportPaths("./c/d", "a/b")).toBe(1);
  });

  it("should put directories before files", () => {
    expect(compareImportPaths("a/a.sol", "a/b")).toBe(1);
    expect(compareImportPaths("a/b", "a/a.sol")).toBe(-1);
    expect(compareImportPaths("a/a.sol", "a/b.sol")).toBe(-1);
    expect(compareImportPaths("a/b.sol", "a/a.sol")).toBe(1);

    expect(compareImportPaths("./a/a.sol", "./a/b")).toBe(1);
    expect(compareImportPaths("./a/b", "./a/a.sol")).toBe(-1);
    expect(compareImportPaths("./a/a.sol", "./a/b.sol")).toBe(-1);
    expect(compareImportPaths("./a/b.sol", "./a/a.sol")).toBe(1);
  });

  it("should put paths that are further up the tree first", () => {
    expect(compareImportPaths("../b", "./a")).toBe(-1);
    expect(compareImportPaths("./a", "../b")).toBe(1);
    expect(compareImportPaths("../../b", "../a")).toBe(-1);
    expect(compareImportPaths("../a", "../../b")).toBe(1);
    expect(compareImportPaths("../../a", "../../b")).toBe(-1);
    expect(compareImportPaths("../../b", "../../a")).toBe(1);
    expect(compareImportPaths("../../a", "../../a")).toBe(0);

    expect(compareImportPaths("../../../b", "../_a")).toBe(-1);
    expect(compareImportPaths("../b/c.sol", "../a.sol")).toBe(-1);
  });
});
