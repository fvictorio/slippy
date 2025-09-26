import { Parser } from "@nomicfoundation/slang/parser";
import { DiagnosticToReport } from "./rules/types.js";
import { TerminalKind, TextRange } from "@nomicfoundation/slang/cst";
import { File as SlangFile } from "@nomicfoundation/slang/compilation";

const disableNextLineMarker = "slippy-disable-next-line";
type DisableNextLineDirective = {
  marker: typeof disableNextLineMarker;
  disabledLine: number;
  disabledRules: string[];
  textRange: TextRange;
};

const disableLineMarker = "slippy-disable-line";
type DisableLineDirective = {
  marker: typeof disableLineMarker;
  disabledLine: number;
  disabledRules: string[];
  textRange: TextRange;
};

const disablePreviousLineMarker = "slippy-disable-previous-line";
type DisablePreviousLineDirective = {
  marker: typeof disablePreviousLineMarker;
  disabledLine: number;
  disabledRules: string[];
  textRange: TextRange;
};

const disableMarker = "slippy-disable";
type DisableDirective = {
  marker: typeof disableMarker;
  endLine: number;
  endColumn: number;
  disabledRules: string[];
  textRange: TextRange;
};

const enableMarker = "slippy-enable";
type EnableDirective = {
  marker: typeof enableMarker;
  endLine: number;
  endColumn: number;
  enabledRules: string[];
  textRange: TextRange;
};

type CommentDirective =
  | DisableNextLineDirective
  | DisableLineDirective
  | DisablePreviousLineDirective
  | DisableDirective
  | EnableDirective;

export function filterByCommentDirectives(
  content: string,
  diagnostics: DiagnosticToReport[],
  file: SlangFile,
  languageVersion: string,
): DiagnosticToReport[] {
  const directives = extractCommentDirectives(content, languageVersion);

  const diagnosticsAndStatus: Array<{
    diagnostic: DiagnosticToReport;
    disabledBy: CommentDirective | null;
  }> = diagnostics.map((diagnostic) => {
    return {
      diagnostic,
      disabledBy: null,
    };
  });

  for (const diagnosticAndStatus of diagnosticsAndStatus) {
    for (const directive of directives) {
      if (
        directive.marker === "slippy-disable-next-line" ||
        directive.marker === "slippy-disable-line" ||
        directive.marker === "slippy-disable-previous-line"
      ) {
        if (diagnosticAndStatus.diagnostic.line === directive.disabledLine) {
          if (
            directive.disabledRules.length === 0 ||
            (diagnosticAndStatus.diagnostic.rule !== null &&
              directive.disabledRules.includes(
                diagnosticAndStatus.diagnostic.rule,
              ))
          ) {
            diagnosticAndStatus.disabledBy = directive;
          }
        }
      } else if (directive.marker === "slippy-disable") {
        if (
          diagnosticAndStatus.diagnostic.line > directive.endLine ||
          (diagnosticAndStatus.diagnostic.line === directive.endLine &&
            diagnosticAndStatus.diagnostic.column >= directive.endColumn)
        ) {
          if (
            directive.disabledRules.length === 0 ||
            (diagnosticAndStatus.diagnostic.rule !== null &&
              directive.disabledRules.includes(
                diagnosticAndStatus.diagnostic.rule,
              ))
          ) {
            diagnosticAndStatus.disabledBy = directive;
          }
        }
      } else if (directive.marker === "slippy-enable") {
        if (
          diagnosticAndStatus.diagnostic.line > directive.endLine ||
          (diagnosticAndStatus.diagnostic.line === directive.endLine &&
            diagnosticAndStatus.diagnostic.column >= directive.endColumn)
        ) {
          if (
            directive.enabledRules.length === 0 ||
            (diagnosticAndStatus.diagnostic.rule !== null &&
              directive.enabledRules.includes(
                diagnosticAndStatus.diagnostic.rule,
              ))
          ) {
            diagnosticAndStatus.disabledBy = null;
          }
        }
      }
    }
  }

  const filteredDiagnostics: DiagnosticToReport[] =
    diagnosticsAndStatus.flatMap((diagnosticAndStatus) => {
      if (diagnosticAndStatus.disabledBy === null) {
        return [diagnosticAndStatus.diagnostic];
      }
      return [];
    });

  const usedDirectives = new Map<CommentDirective, string[]>();
  for (const diagnosticAndStatus of diagnosticsAndStatus) {
    if (
      diagnosticAndStatus.disabledBy !== null &&
      diagnosticAndStatus.diagnostic.rule !== null
    ) {
      const usedBy = usedDirectives.get(diagnosticAndStatus.disabledBy) ?? [];
      usedBy.push(diagnosticAndStatus.diagnostic.rule);
      usedDirectives.set(diagnosticAndStatus.disabledBy, usedBy);
    }
  }

  const usedEnableDirectives = new Map<EnableDirective, string[]>();

  for (const [i, disableDirective] of directives.entries()) {
    if (disableDirective.marker !== "slippy-disable") {
      continue;
    }

    if (disableDirective.disabledRules.length === 0) {
      const allEnabledRules = new Set<string>();

      for (const enableDirective of directives.slice(i + 1)) {
        if (enableDirective.marker !== "slippy-enable") {
          continue;
        }

        if (enableDirective.enabledRules.length === 0) {
          usedEnableDirectives.set(enableDirective, []);
          break;
        }

        for (const rule of enableDirective.enabledRules) {
          if (!allEnabledRules.has(rule)) {
            allEnabledRules.add(rule);
            const enabledRules =
              usedEnableDirectives.get(enableDirective) ?? [];
            enabledRules.push(rule);
            usedEnableDirectives.set(enableDirective, enabledRules);
          }
        }
      }
    } else {
      const disabledRules = new Set<string>(disableDirective.disabledRules);

      for (const enableDirective of directives.slice(i + 1)) {
        if (disabledRules.size === 0) {
          break;
        }
        if (enableDirective.marker !== "slippy-enable") {
          continue;
        }

        if (enableDirective.enabledRules.length === 0) {
          usedEnableDirectives.set(enableDirective, []);
          break;
        }

        for (const rule of enableDirective.enabledRules) {
          if (disabledRules.has(rule)) {
            disabledRules.delete(rule);
            const enabledRules =
              usedEnableDirectives.get(enableDirective) ?? [];
            enabledRules.push(rule);
            usedEnableDirectives.set(enableDirective, enabledRules);
          }
        }
      }
    }
  }

  for (const directive of directives) {
    if (directive.marker === "slippy-enable") {
      const usedBy = usedEnableDirectives.get(directive);

      if (directive.enabledRules.length === 0) {
        if (usedBy === undefined) {
          filteredDiagnostics.push({
            sourceId: file.id,
            line: directive.textRange.start.line,
            column: directive.textRange.start.column,
            rule: null,
            message: `Unused ${directive.marker} directive (no matching ${disableMarker} directives were found)`,
            severity: "warn",
          });
          continue;
        }
      } else {
        const unusedRules = directive.enabledRules.filter(
          (rule) => !(usedBy ?? []).includes(rule),
        );

        if (unusedRules.length === 0) {
          continue;
        }

        let rulesFragment = `'${unusedRules[0]}'`;
        for (let i = 1; i + 1 < unusedRules.length; i++) {
          rulesFragment += `, '${unusedRules[i]}'`;
        }
        if (unusedRules.length > 1) {
          rulesFragment += ` or '${unusedRules[unusedRules.length - 1]}'`;
        }

        filteredDiagnostics.push({
          sourceId: file.id,
          line: directive.textRange.start.line,
          column: directive.textRange.start.column,
          rule: null,
          message: `Unused ${directive.marker} directive (no matching ${disableMarker} directives were found for ${rulesFragment})`,
          severity: "warn",
        });
      }

      continue;
    }

    const usedBy = usedDirectives.get(directive) ?? [];

    if (directive.disabledRules.length === 0) {
      if (usedBy.length === 0) {
        filteredDiagnostics.push({
          sourceId: file.id,
          line: directive.textRange.start.line,
          column: directive.textRange.start.column,
          rule: null,
          message: `Unused ${directive.marker} directive (no problems were reported)`,
          severity: "warn",
        });
        continue;
      }
    } else {
      const unusedRules = directive.disabledRules.filter(
        (rule) => !usedBy.includes(rule),
      );
      if (unusedRules.length > 0) {
        let rulesFragment = `'${unusedRules[0]}'`;
        for (let i = 1; i + 1 < unusedRules.length; i++) {
          rulesFragment += `, '${unusedRules[i]}'`;
        }
        if (unusedRules.length > 1) {
          rulesFragment += ` or '${unusedRules[unusedRules.length - 1]}'`;
        }

        filteredDiagnostics.push({
          sourceId: file.id,
          line: directive.textRange.start.line,
          column: directive.textRange.start.column,
          rule: null,
          message: `Unused ${directive.marker} directive (no problems were reported from ${rulesFragment})`,
          severity: "warn",
        });
      }
    }
  }

  return filteredDiagnostics;
}

export function extractCommentDirectives(
  content: string,
  languageVersion: string,
): CommentDirective[] {
  const directives: CommentDirective[] = [];
  const parser = Parser.create(languageVersion);

  const parseOutput = parser.parseFileContents(content);

  const cursor = parseOutput.createTreeCursor();

  while (
    cursor.goToNextTerminalWithKinds([
      TerminalKind.SingleLineComment,
      TerminalKind.MultiLineComment,
    ])
  ) {
    let commentText = cursor.node.unparse().slice(2).trim();
    if (cursor.node.kind === TerminalKind.MultiLineComment) {
      commentText = commentText.slice(0, -2).trim();
    }

    const firstSpace = /\s/.exec(commentText)?.index;
    const args =
      firstSpace === undefined
        ? []
        : commentText
            .slice(firstSpace + 1)
            .trim()
            .split(",")
            .map((rule) => rule.trim())
            .filter((rule) => rule.length > 0);

    if (commentText.startsWith(disableNextLineMarker)) {
      directives.push({
        marker: "slippy-disable-next-line",
        disabledLine: cursor.textRange.end.line + 1,
        disabledRules: args,
        textRange: cursor.textRange,
      });
    } else if (commentText.startsWith(disableLineMarker)) {
      directives.push({
        marker: "slippy-disable-line",
        disabledLine: cursor.textRange.start.line,
        disabledRules: args,
        textRange: cursor.textRange,
      });
    } else if (commentText.startsWith(disablePreviousLineMarker)) {
      directives.push({
        marker: "slippy-disable-previous-line",
        disabledLine: cursor.textRange.start.line - 1,
        disabledRules: args,
        textRange: cursor.textRange,
      });
    } else if (commentText.startsWith(disableMarker)) {
      directives.push({
        marker: "slippy-disable",
        endLine: cursor.textRange.end.line,
        endColumn: cursor.textRange.end.column,
        disabledRules: args,
        textRange: cursor.textRange,
      });
    } else if (commentText.startsWith(enableMarker)) {
      directives.push({
        marker: "slippy-enable",
        endLine: cursor.textRange.end.line,
        endColumn: cursor.textRange.end.column,
        enabledRules: args,
        textRange: cursor.textRange,
      });
    }
  }

  return directives;
}
