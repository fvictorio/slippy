import { DiagnosticToReport } from "./rules/types.js";
import chalk from "chalk";

export interface Colorizer {
  yellow: (text: string) => string;
  red: (text: string) => string;
  dim: (text: string) => string;
  underline: (text: string) => string;
  bold: (text: string) => string;
}

export function formatAndPrintDiagnostics(
  diagnostics: DiagnosticToReport[],
  sourceIdToAbsolutePath: Record<string, string>,
  consoleLog: (...args: string[]) => void = console.log,
  colorizer: Colorizer = chalk,
): void {
  if (diagnostics.length === 0) {
    return;
  }

  consoleLog();
  const groupedDiagnostics: Record<string, DiagnosticToReport[]> = {};

  for (const diagnostic of diagnostics) {
    const absolutePath = sourceIdToAbsolutePath[diagnostic.sourceId];
    groupedDiagnostics[absolutePath] ||= [];
    groupedDiagnostics[absolutePath].push(diagnostic);
  }

  let errorCount = 0;
  let warningCount = 0;

  let maxPositionLength = 0;
  let maxMessageLength = 0;
  let maxSeverityLength = 0;
  let firstIteration = true;
  for (const [absolutePath, diagnostics] of Object.entries(
    groupedDiagnostics,
  )) {
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
    for (const diagnostic of diagnostics) {
      if (diagnostic.severity === "error") {
        errorCount++;
      } else {
        warningCount++;
      }

      const position = `${diagnostic.line + 1}:${diagnostic.column + 1}`;
      maxPositionLength = Math.max(maxPositionLength, position.length);
      maxMessageLength = Math.max(maxMessageLength, diagnostic.message.length);

      const severity = diagnostic.severity === "error" ? "error" : "warning";
      maxSeverityLength = Math.max(maxSeverityLength, severity.length);

      errorLines.push({
        position,
        severity,
        message: diagnostic.message,
        rule: diagnostic.rule,
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
    diagnostics.length === 1 ? "1 problem" : `${diagnostics.length} problems`;
  const errorFragment =
    errorCount === 1 ? `${errorCount} error` : `${errorCount} errors`;
  const warningFragment =
    warningCount === 1 ? `${warningCount} warning` : `${warningCount} warnings`;

  const summary = colorizer.bold(
    `✖ ${problemsFragment} (${errorFragment}, ${warningFragment})`,
  );

  if (errorCount > 0) {
    consoleLog(colorizer.red(summary));
  } else {
    consoleLog(colorizer.yellow(summary));
  }
}
