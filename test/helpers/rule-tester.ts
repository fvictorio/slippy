import { expect, it } from "vitest";
import { LintResult } from "../../src/rules/types.js";
import { Linter } from "../../src/linter.js";
import { mockSingleRuleConfigLoader } from "./config.js";

export interface RuleTestFixture {
  only?: true;
  description: string;
  content: string;
  config?: any[];
}

type MinimalLintResult = Omit<LintResult, "message" | "severity">;

export class RuleTester {
  constructor(private ruleName: string) {}

  public runFixtures(fixtures: RuleTestFixture[]) {
    for (const fixture of fixtures) {
      const itFunction = fixture.only === true ? it.only : it;
      itFunction(fixture.description, async () => {
        await this.testFixture(fixture);
      });
    }
  }

  private async testFixture(fixture: RuleTestFixture) {
    const linter = new Linter(
      mockSingleRuleConfigLoader(this.ruleName, fixture.config),
    );
    const { content: contentWithoutMarkers, expectedResults } =
      this.parseFixture(fixture.content);

    const results = await linter.lintText(
      contentWithoutMarkers,
      "contract.sol",
    );
    this.compareResults(results, expectedResults);
  }

  private parseFixture(fixtureContent: string): {
    content: string;
    expectedResults: MinimalLintResult[];
  } {
    const lines = fixtureContent.split("\n");
    const parsedLines: string[] = [];
    const expectedResults: MinimalLintResult[] = [];

    for (const line of lines) {
      if (/^\s*\^+\s*$/.test(line)) {
        const expectedResult: MinimalLintResult = {
          rule: this.ruleName,
          sourceId: "contract.sol",
          line: parsedLines.length - 1,
          column: line.indexOf("^"),
        };
        expectedResults.push(expectedResult);
      } else {
        parsedLines.push(line);
      }
    }

    return { content: parsedLines.join("\n"), expectedResults };
  }

  private compareResults(actual: LintResult[], expected: MinimalLintResult[]) {
    expect(
      actual.map((result) => {
        return {
          sourceId: result.sourceId,
          line: result.line,
          column: result.column,
          rule: result.rule,
        };
      }),
    ).toEqual(expected);
  }
}
