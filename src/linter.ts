import {
  Diagnostic,
  DiagnosticToReport,
  Fix,
  LintResult,
  RuleDefinition,
  SourceFile,
} from "./rules/types.js";
import { filterByCommentDirectives } from "./comment-directives.js";
import { compilationUnitFromContent } from "./slang/compilation-unit.js";
import { ConfigLoader, EffectiveConfig } from "./config.js";
import {
  SlippyParsingErrorAfterFixError,
  SlippyRuleConfigError,
  SlippyRuleNotRegisteredError,
  SlippyTooManyFixesError,
} from "./errors.js";
import { getAllRules } from "./rules/get-all-rules.js";
import setupDebug from "debug";
import * as z from "zod";
import {
  CompilationUnit,
  File as SlangFile,
} from "@nomicfoundation/slang/compilation";
import { getAppliableFixes } from "./internal/autofix.js";

const debug = setupDebug("slippy:linter");

interface LintOptions {
  fix: boolean;
}

export class Linter {
  private ruleNameToRule: Map<string, RuleDefinition<any>> = new Map();

  constructor(private configLoader: ConfigLoader) {
    this.registerBuiltInRules();
  }

  /**
   * @returns A list of `LintResult`s in the same order of the corresponding file.
   */
  public async lintFiles(
    files: SourceFile[],
    options: LintOptions,
  ): Promise<LintResult[]> {
    const lintResults: LintResult[] = [];
    for (const file of files) {
      lintResults.push(
        await this.lintText(file.content, file.filePath, options),
      );
    }

    return lintResults;
  }

  public async lintText(
    originalContent: string,
    filePath: string,
    options?: LintOptions,
  ): Promise<LintResult> {
    const fix = options?.fix ?? false;
    const config = this.configLoader.loadConfig(filePath);

    let content = originalContent;

    for (let fixIteration = 0; fixIteration < 10; fixIteration++) {
      const unit = await compilationUnitFromContent({ content, filePath });
      const file = unit.file(filePath)!;

      if (file.errors().length > 0) {
        if (fixIteration > 0) {
          // if this is not the first iteration, it means that the autofix introduced a parsing error
          throw new SlippyParsingErrorAfterFixError(filePath);
        }

        const parsingErrorDiagnostic: DiagnosticToReport = {
          sourceId: file.id,
          rule: null,
          line: file.errors()[0].textRange.start.line,
          column: file.errors()[0].textRange.start.column,
          message: "Parsing error",
          severity: "error",
        };

        return { diagnostics: [parsingErrorDiagnostic] };
      }

      const unfilteredDiagnostics = this.getDiagnostics(
        content,
        unit,
        file,
        config,
      );

      const diagnostics = filterByCommentDirectives(
        content,
        unfilteredDiagnostics,
        file,
        unit.languageVersion,
      );

      if (!fix) {
        debug("autofix is disabled, returning diagnostics only");

        const result: LintResult = { diagnostics: diagnostics };
        return result;
      }

      debug("applying fixes, iteration %s", fixIteration);
      const fixedContent = this.applyFixes(content, diagnostics);

      if (content === fixedContent) {
        if (fixedContent === originalContent) {
          return { diagnostics };
        } else {
          return { diagnostics, fixedContent };
        }
      }

      content = fixedContent;
    }

    throw new SlippyTooManyFixesError(filePath);
  }

  public addRule(rule: RuleDefinition<any>) {
    this.ruleNameToRule.set(rule.name, rule);
  }

  private getDiagnostics(
    content: string,
    unit: CompilationUnit,
    file: SlangFile,
    config: EffectiveConfig,
  ): DiagnosticToReport[] {
    const diagnostics: DiagnosticToReport[] = [];

    for (const [ruleName, ruleConfig] of Object.entries(config.rules)) {
      const Rule = this.ruleNameToRule.get(ruleName);
      if (Rule === undefined) {
        throw new SlippyRuleNotRegisteredError(ruleName);
      }

      const severity = ruleConfig[0];

      if (severity === "off") continue;

      let rule;
      if ("parseConfig" in Rule) {
        try {
          const config = Rule.parseConfig(ruleConfig[1]);
          rule = Rule.create(config);
        } catch (error: unknown) {
          if (error instanceof z.ZodError) {
            const problem = z.prettifyError(error);
            throw new SlippyRuleConfigError(Rule.name, `\n\n${problem}`);
          }

          throw error;
        }
      } else {
        if (ruleConfig.length > 1) {
          throw new SlippyRuleConfigError(
            Rule.name,
            "Rule requires no configuration, but received an array with more than one element.",
          );
        }
        rule = Rule.create();
      }
      const ruleDiagnostics: Diagnostic[] = rule.run({
        unit,
        file,
        content,
      });

      const ruleDiagnosticsToReport: DiagnosticToReport[] = ruleDiagnostics.map(
        (diagnostic) => {
          return {
            ...diagnostic,
            severity,
          };
        },
      );

      diagnostics.push(...ruleDiagnosticsToReport);
    }

    return diagnostics;
  }

  private applyFixes(
    content: string,
    diagnostics: DiagnosticToReport[],
  ): string {
    const fixedContentParts: string[] = [];
    let end = content.length;

    const allFixes: Fix[] = diagnostics.flatMap((d) =>
      d.fix === undefined ? [] : [d.fix],
    );

    debug("found %d fixes", allFixes.length);

    if (allFixes.length === 0) {
      return content;
    }

    const fixes = getAppliableFixes(allFixes);

    debug("applying %d fixes of %d", fixes.length, allFixes.length);

    for (const fix of fixes) {
      for (const change of fix) {
        fixedContentParts.push(content.slice(change.range[1], end));
        fixedContentParts.push(change.replacement);
        end = change.range[0];
      }
    }

    fixedContentParts.push(content.slice(0, end));
    fixedContentParts.reverse();

    return fixedContentParts.join("");
  }

  private registerBuiltInRules() {
    const rules = getAllRules();

    for (const rule of rules) {
      this.ruleNameToRule.set(rule.name, rule);
    }
  }
}
