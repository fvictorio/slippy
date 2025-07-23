import { Parser } from "@nomicfoundation/slang/parser";
import { LintResultToReport } from "./rules/types.js";
import { TerminalKind, TextRange } from "@nomicfoundation/slang/cst";
import { File as SlangFile } from "@nomicfoundation/slang/compilation";

const disableNextLineMarker = "slippy-disable-next-line";
type DisableNextLineDirective = {
  kind: "disable-next-line";
  disabledLine: number;
  disabledRules: string[];
  textRange: TextRange;
};

const disabledLineMarker = "slippy-disable-line";
type DisableLineDirective = {
  kind: "disable-line";
  disabledLine: number;
  disabledRules: string[];
  textRange: TextRange;
};

const disabledPreviousLineMarker = "slippy-disable-previous-line";
type DisablePreviousLineDirective = {
  kind: "disable-previous-line";
  disabledLine: number;
  disabledRules: string[];
  textRange: TextRange;
};

type CommentDirective =
  | DisableNextLineDirective
  | DisableLineDirective
  | DisablePreviousLineDirective;

export function filterByCommentDirectives(
  content: string,
  results: LintResultToReport[],
  file: SlangFile,
  languageVersion: string,
): LintResultToReport[] {
  let filteredResults = results;
  const directives = extractCommentDirectives(content, languageVersion);
  const directivesAndUsageCount = directives.map((directive) => ({
    directive,
    usageCount: 0,
  }));

  for (const directiveAndUsageCount of directivesAndUsageCount) {
    const { directive } = directiveAndUsageCount;
    if (
      directive.kind === "disable-next-line" ||
      directive.kind === "disable-line" ||
      directive.kind === "disable-previous-line"
    ) {
      filteredResults = filteredResults.filter((result) => {
        if (result.line !== directive.disabledLine) {
          return true;
        }
        if (directive.disabledRules.length === 0) {
          directiveAndUsageCount.usageCount++;
          return false;
        }
        if (
          result.rule !== null &&
          directive.disabledRules.includes(result.rule)
        ) {
          directiveAndUsageCount.usageCount++;
          return false;
        }

        return true;
      });
    }
  }

  for (const directiveAndUsageCount of directivesAndUsageCount) {
    const { directive, usageCount } = directiveAndUsageCount;
    if (usageCount === 0) {
      filteredResults.push({
        sourceId: file.id,
        line: directive.textRange.start.line,
        column: directive.textRange.start.column,
        rule: null,
        message: `Unused comment directive: ${directive.kind}`,
        severity: "warn",
      });
    }
  }

  return filteredResults;
}

export function extractCommentDirectives(
  content: string,
  languageVersion: string,
): CommentDirective[] {
  const directives: CommentDirective[] = [];
  const parser = Parser.create(languageVersion);

  const parseOutput = parser.parseFileContents(content);

  const cursor = parseOutput.createTreeCursor();

  while (cursor.goToNextTerminalWithKind(TerminalKind.SingleLineComment)) {
    const commentText = cursor.node.unparse().slice(2).trim();
    if (commentText.startsWith(disableNextLineMarker)) {
      const disabledRules = commentText
        .slice(disableNextLineMarker.length)
        .trim()
        .split(",")
        .map((rule) => rule.trim())
        .filter((rule) => rule.length > 0);

      directives.push({
        kind: "disable-next-line",
        disabledLine: cursor.textRange.end.line + 1,
        disabledRules,
        textRange: cursor.textRange,
      });
    } else if (commentText.startsWith(disabledLineMarker)) {
      const disabledRules = commentText
        .slice(disabledLineMarker.length)
        .trim()
        .split(",")
        .map((rule) => rule.trim())
        .filter((rule) => rule.length > 0);

      directives.push({
        kind: "disable-line",
        disabledLine: cursor.textRange.start.line,
        disabledRules,
        textRange: cursor.textRange,
      });
    } else if (commentText.startsWith(disabledPreviousLineMarker)) {
      const disabledRules = commentText
        .slice(disabledPreviousLineMarker.length)
        .trim()
        .split(",")
        .map((rule) => rule.trim())
        .filter((rule) => rule.length > 0);

      directives.push({
        kind: "disable-previous-line",
        disabledLine: cursor.textRange.start.line - 1,
        disabledRules,
        textRange: cursor.textRange,
      });
    }
  }

  return directives;
}
