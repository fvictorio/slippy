import { expect, it } from "vitest";
import { Diagnostic } from "../../src/rules/types.js";
import { Linter } from "../../src/linter.js";
import { mockSingleRuleConfigLoader } from "./config.js";

export interface RuleTestFixture {
  only?: true;
  description: string;
  content: string;
  config?: any[];
  fixed?: string;
  messageIncludes?: string;
}

type MinimalDiagnostic = {
  sourceId: string;
  line: number;
  column: number;
  rule: string | null;
  message?: string;
};

interface RuleTesterDebuggingOptions {
  includeMessage?: boolean;
  ignoreFixed?: boolean;
}

export class RuleTester {
  constructor(private ruleName: string) {}

  public runFixtures(
    fixtures: RuleTestFixture[],
    debuggingOptions?: RuleTesterDebuggingOptions,
  ) {
    // throw if options are passed in the CI environment
    if (process.env.CI !== undefined && debuggingOptions !== undefined) {
      throw new Error(
        "Passing debugging options to runFixtures is only allowed for local testing.",
      );
    }

    for (const fixture of fixtures) {
      const itFunction = fixture.only === true ? it.only : it;
      itFunction(fixture.description, async () => {
        await this.testFixture(fixture, debuggingOptions);
      });
    }
  }

  private async testFixture(
    fixture: RuleTestFixture,
    debuggingOptions?: RuleTesterDebuggingOptions,
  ) {
    const linter = new Linter(
      mockSingleRuleConfigLoader(this.ruleName, fixture.config),
    );
    const {
      content: contentWithoutMarkers,
      expectedDiagnostics: expectedDiagnostics,
    } = this.parseFixture(fixture.content);

    const { diagnostics } = await linter.lintText(
      contentWithoutMarkers,
      "contract.sol",
    );
    this.compareDiagnostics(
      diagnostics,
      expectedDiagnostics,
      debuggingOptions?.includeMessage ?? false,
    );

    if (fixture.messageIncludes !== undefined) {
      if (diagnostics.length !== 1) {
        throw new Error(
          "messageIncludes can only be used when only one diagnostic is expected.",
        );
      }

      expect(
        diagnostics[0].message,
        "Diagnostic message does not include expected substring",
      ).toContain(fixture.messageIncludes);
    }

    if (fixture.fixed !== undefined && debuggingOptions?.ignoreFixed !== true) {
      const { fixedContent } = await linter.lintText(
        contentWithoutMarkers,
        "contract.sol",
        { fix: true },
      );

      expect(
        fixedContent,
        "Fixed content doesn't match the expected value",
      ).toBe(fixture.fixed);
    }
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
    includeMessage: boolean,
  ) {
    expect(
      actual.map((diagnostic) => {
        const diagnosticToCompare: MinimalDiagnostic = {
          sourceId: diagnostic.sourceId,
          line: diagnostic.line,
          column: diagnostic.column,
          rule: diagnostic.rule,
        };

        if (includeMessage) {
          diagnosticToCompare.message = diagnostic.message;
        }

        return diagnosticToCompare;
      }),
    ).toEqual(expected);
  }
}
