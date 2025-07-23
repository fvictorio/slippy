import { LintResultToReport } from "./rules/types.js";
import chalk from "chalk";

export interface Colorizer {
  yellow: (text: string) => string;
  red: (text: string) => string;
  dim: (text: string) => string;
  underline: (text: string) => string;
}

export function formatAndPrintResults(
  results: LintResultToReport[],
  sourceIdToAbsolutePath: Record<string, string>,
  consoleLog: (...args: string[]) => void = console.log,
  colorizer: Colorizer = chalk,
): void {
  if (results.length === 0) {
    return;
  }

  const groupedResults: Record<string, LintResultToReport[]> = {};

  for (const result of results) {
    const absolutePath = sourceIdToAbsolutePath[result.sourceId];
    groupedResults[absolutePath] ||= [];
    groupedResults[absolutePath].push(result);
  }

  let errorCount = 0;
  let warningCount = 0;

  let maxPositionLength = 0;
  let maxMessageLength = 0;
  let maxSeverityLength = 0;
  let firstIteration = true;
  for (const [absolutePath, results] of Object.entries(groupedResults)) {
    if (!firstIteration) {
      consoleLog();
    }
    firstIteration = false;
    consoleLog(colorizer.underline(absolutePath));

    const errorLines: Array<{
      position: string;
      severity: string;
      message: string;
      rule: string | null;
    }> = [];
    for (const result of results) {
      if (result.severity === "error") {
        errorCount++;
      } else {
        warningCount++;
      }

      const position = `${result.line + 1}:${result.column + 1}`;
      maxPositionLength = Math.max(maxPositionLength, position.length);
      maxMessageLength = Math.max(maxMessageLength, result.message.length);

      const severity = result.severity === "error" ? "error" : "warning";
      maxSeverityLength = Math.max(maxSeverityLength, severity.length);

      errorLines.push({
        position,
        severity,
        message: result.message,
        rule: result.rule,
      });
    }

    for (const errorLine of errorLines) {
      let line = "  ";
      line += colorizer.dim(errorLine.position.padEnd(maxPositionLength));
      line += "  ";
      const colorFunction =
        errorLine.severity === "error" ? colorizer.red : colorizer.yellow;
      line += colorFunction(errorLine.severity.padEnd(maxSeverityLength));
      line += "  ";
      line += errorLine.message.padEnd(maxMessageLength);
      if (errorLine.rule !== null) {
        line += "  ";
        line += colorizer.dim(`[${errorLine.rule}]`);
      }

      consoleLog(line);
    }
  }

  consoleLog();

  const problemsFragment =
    results.length === 1 ? "1 problem" : `${results.length} problems`;
  const errorFragment =
    errorCount === 1 ? `${errorCount} error` : `${errorCount} errors`;
  const warningFragment =
    warningCount === 1 ? `${warningCount} warning` : `${warningCount} warnings`;

  const summary = `✖ ${problemsFragment} (${errorFragment}, ${warningFragment})`;

  if (errorCount > 0) {
    consoleLog(colorizer.red(summary));
  } else {
    consoleLog(colorizer.yellow(summary));
  }
}
