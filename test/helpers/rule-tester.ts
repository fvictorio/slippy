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

type MinimalLintResult = {
  sourceId: string;
  line: number;
  column: number;
  rule: string | null;
  message?: string;
};

interface RuleTesterOptions {
  includeMessage?: boolean;
}

export class RuleTester {
  private includeMessage = false;

  constructor(
    private ruleName: string,
    options: RuleTesterOptions = {},
  ) {
    this.includeMessage = options.includeMessage ?? false;
  }

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
        const resultToCompare: MinimalLintResult = {
          sourceId: result.sourceId,
          line: result.line,
          column: result.column,
          rule: result.rule,
        };

        if (this.includeMessage) {
          resultToCompare.message = result.message;
        }

        return resultToCompare;
      }),
    ).toEqual(expected);
  }
}
