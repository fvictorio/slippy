import { describe, expect, it } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";
import { compareImportPaths } from "../../src/rules/sort-imports.js";

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
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
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
});
