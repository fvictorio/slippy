import { expect, it } from "vitest";
import { Diagnostic } from "../../src/rules/types.js";
import { Linter } from "../../src/linter.js";
import { mockSingleRuleConfigLoader } from "./config.js";

export interface RuleTestFixture {
  only?: true;
  description: string;
  content: string;
  config?: any[];
}

type MinimalDiagnostic = {
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
    const {
      content: contentWithoutMarkers,
      expectedDiagnostics: expectedDiagnostics,
    } = this.parseFixture(fixture.content);

    const diagnostics = await linter.lintText(
      contentWithoutMarkers,
      "contract.sol",
    );
    this.compareDiagnostics(diagnostics, expectedDiagnostics);
  }

  private parseFixture(fixtureContent: string): {
    content: string;
    expectedDiagnostics: MinimalDiagnostic[];
  } {
    const lines = fixtureContent.split("\n");
    const parsedLines: string[] = [];
    const expectedDiagnostics: MinimalDiagnostic[] = [];

    for (const line of lines) {
      if (/^\s*\^+\s*$/.test(line)) {
        const expectedResult: MinimalDiagnostic = {
          rule: this.ruleName,
          sourceId: "contract.sol",
          line: parsedLines.length - 1,
          column: line.indexOf("^"),
        };
        expectedDiagnostics.push(expectedResult);
      } else {
        parsedLines.push(line);
      }
    }

    return {
      content: parsedLines.join("\n"),
      expectedDiagnostics: expectedDiagnostics,
    };
  }

  private compareDiagnostics(
    actual: Diagnostic[],
    expected: MinimalDiagnostic[],
  ) {
    expect(
      actual.map((diagnostic) => {
        const diagnosticToCompare: MinimalDiagnostic = {
          sourceId: diagnostic.sourceId,
          line: diagnostic.line,
          column: diagnostic.column,
          rule: diagnostic.rule,
        };

        if (this.includeMessage) {
          diagnosticToCompare.message = diagnostic.message;
        }

        return diagnosticToCompare;
      }),
    ).toEqual(expected);
  }
}
