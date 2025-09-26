import {
  Diagnostic,
  DiagnosticToReport,
  RuleDefinition,
  SourceFile,
} from "./rules/types.js";
import { filterByCommentDirectives } from "./comment-directives.js";
import { compilationUnitFromContent } from "./slang/compilation-unit.js";
import { ConfigLoader } from "./config.js";
import {
  SlippyRuleConfigError,
  SlippyRuleNotRegisteredError,
} from "./errors.js";
import { getAllRules } from "./rules/get-all-rules.js";
import * as z from "zod";

export class Linter {
  private ruleNameToRule: Map<string, RuleDefinition<any>> = new Map();

  constructor(private configLoader: ConfigLoader) {
    this.registerBuiltInRules();
  }

  public async lintFiles(files: SourceFile[]): Promise<DiagnosticToReport[]> {
    const diagnostics: DiagnosticToReport[] = [];
    for (const file of files) {
      diagnostics.push(...(await this.lintText(file.content, file.filePath)));
    }

    return diagnostics;
  }

  public async lintText(
    content: string,
    filePath: string,
  ): Promise<DiagnosticToReport[]> {
    const config = this.configLoader.loadConfig(filePath);

    const diagnostics: DiagnosticToReport[] = [];

    const unit = await compilationUnitFromContent({ content, filePath });
    const file = unit.file(filePath)!;

    if (file.errors().length > 0) {
      diagnostics.push({
        sourceId: file.id,
        rule: null,
        line: file.errors()[0].textRange.start.line,
        column: file.errors()[0].textRange.start.column,
        message: "Parsing error",
        severity: "error",
      });
      return diagnostics;
    }

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

    const filteredDiagnostics = filterByCommentDirectives(
      content,
      diagnostics,
      file,
      unit.languageVersion,
    );

    return filteredDiagnostics;
  }

  private registerBuiltInRules() {
    const rules = getAllRules();

    for (const rule of rules) {
      this.ruleNameToRule.set(rule.name, rule);
    }
  }
}
