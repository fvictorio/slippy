import { describe, expect, it } from "vitest";
import { Colorizer, formatAndPrintResults } from "../src/formatter.js";
import { LintResultToReport } from "../src/rules/types.js";

class ConsoleLogMock {
  public logs: string[] = [];
  public log(...args: string[]): void {
    this.logs.push(args.join(" "));
  }
}

const tagColorizer: Colorizer = {
  yellow: (text: string) => `<yel>${text}</yel>`,
  red: (text: string) => `<red>${text}</red>`,
  dim: (text: string) => `<dim>${text}</dim>`,
  underline: (text: string) => `<und>${text}</und>`,
  bold: (text: string) => `<bol>${text}</bol>`,
};

describe("formatter", function () {
  it("should not print anything if there are no results", function () {
    const consoleLogMock = new ConsoleLogMock();

    const results: LintResultToReport[] = [];

    formatAndPrintResults(
      results,
      {},
      consoleLogMock.log.bind(consoleLogMock),
      tagColorizer,
    );

    expect(consoleLogMock.logs).toEqual([]);
  });

  it("should print one error result", function () {
    const consoleLogMock = new ConsoleLogMock();

    const results: LintResultToReport[] = [
      {
        sourceId: "file.sol",
        line: 1,
        column: 2,
        rule: "some-rule",
        message: "Some message",
        severity: "error",
      },
    ];

    const sourceIdToAbsolutePath = {
      "file.sol": "/absolute/path/to/file.sol",
    };

    formatAndPrintResults(
      results,
      sourceIdToAbsolutePath,
      consoleLogMock.log.bind(consoleLogMock),
      tagColorizer,
    );

    expect(consoleLogMock.logs.join("\n")).toMatchInlineSnapshot(`
      "
      <und>/absolute/path/to/file.sol</und>
        <dim>2:3</dim>  <red>error</red>  Some message  <dim>[some-rule]</dim>

      <red><bol>✖ 1 problem (1 error, 0 warnings)</bol></red>"
    `);
  });

  it("should print one warning result", function () {
    const consoleLogMock = new ConsoleLogMock();

    const results: LintResultToReport[] = [
      {
        sourceId: "file.sol",
        line: 1,
        column: 2,
        rule: "some-rule",
        message: "Some message",
        severity: "warn",
      },
    ];

    const sourceIdToAbsolutePath = {
      "file.sol": "/absolute/path/to/file.sol",
    };

    formatAndPrintResults(
      results,
      sourceIdToAbsolutePath,
      consoleLogMock.log.bind(consoleLogMock),
      tagColorizer,
    );

    expect(consoleLogMock.logs.join("\n")).toMatchInlineSnapshot(`
      "
      <und>/absolute/path/to/file.sol</und>
        <dim>2:3</dim>  <yel>warning</yel>  Some message  <dim>[some-rule]</dim>

      <yel><bol>✖ 1 problem (0 errors, 1 warning)</bol></yel>"
    `);
  });

  it("should print one error and one warning result", function () {
    const consoleLogMock = new ConsoleLogMock();

    const results: LintResultToReport[] = [
      {
        sourceId: "file.sol",
        line: 1,
        column: 2,
        rule: "some-rule",
        message: "Some message",
        severity: "error",
      },
      {
        sourceId: "file.sol",
        line: 3,
        column: 4,
        rule: "some-other-rule",
        message: "Some other message",
        severity: "warn",
      },
    ];

    const sourceIdToAbsolutePath = {
      "file.sol": "/absolute/path/to/file.sol",
    };

    formatAndPrintResults(
      results,
      sourceIdToAbsolutePath,
      consoleLogMock.log.bind(consoleLogMock),
      tagColorizer,
    );

    expect(consoleLogMock.logs.join("\n")).toMatchInlineSnapshot(`
      "
      <und>/absolute/path/to/file.sol</und>
        <dim>2:3</dim>  <red>error  </red>  Some message        <dim>[some-rule]</dim>
        <dim>4:5</dim>  <yel>warning</yel>  Some other message  <dim>[some-other-rule]</dim>

      <red><bol>✖ 2 problems (1 error, 1 warning)</bol></red>"
    `);
  });

  it("should print results from two files", function () {
    const consoleLogMock = new ConsoleLogMock();

    const results: LintResultToReport[] = [
      {
        sourceId: "file1.sol",
        line: 1,
        column: 2,
        rule: "rule1",
        message: "Error in file1",
        severity: "error",
      },
      {
        sourceId: "file2.sol",
        line: 3,
        column: 4,
        rule: "rule2",
        message: "Warning in file2",
        severity: "warn",
      },
    ];

    const sourceIdToAbsolutePath = {
      "file1.sol": "/absolute/path/to/file1.sol",
      "file2.sol": "/absolute/path/to/file2.sol",
    };

    formatAndPrintResults(
      results,
      sourceIdToAbsolutePath,
      consoleLogMock.log.bind(consoleLogMock),
      tagColorizer,
    );

    expect(consoleLogMock.logs.join("\n")).toMatchInlineSnapshot(`
      "
      <und>/absolute/path/to/file1.sol</und>
        <dim>2:3</dim>  <red>error</red>  Error in file1  <dim>[rule1]</dim>

      <und>/absolute/path/to/file2.sol</und>
        <dim>4:5</dim>  <yel>warning</yel>  Warning in file2  <dim>[rule2]</dim>

      <red><bol>✖ 2 problems (1 error, 1 warning)</bol></red>"
    `);
  });
});
