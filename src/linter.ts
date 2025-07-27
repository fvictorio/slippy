import {
  LintResult,
  LintResultToReport,
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

  public async lintFiles(files: SourceFile[]): Promise<LintResultToReport[]> {
    const results: LintResultToReport[] = [];
    for (const file of files) {
      results.push(...(await this.lintText(file.content, file.filePath)));
    }

    return results;
  }

  public async lintText(
    content: string,
    filePath: string,
  ): Promise<LintResultToReport[]> {
    const config = this.configLoader.loadConfig(filePath);

    if (config === undefined) {
      return [];
    }

    const results: LintResultToReport[] = [];

    const unit = await compilationUnitFromContent({ content, filePath });
    const file = unit.file(filePath)!;

    if (file.errors().length > 0) {
      results.push({
        sourceId: file.id,
        rule: null,
        line: file.errors()[0].textRange.start.line,
        column: file.errors()[0].textRange.start.column,
        message: "Parsing error",
        severity: "error",
      });
      return results;
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
      const ruleResults: LintResult[] = await rule.run({
        unit,
        file,
      });

      const ruleResultsToReport: LintResultToReport[] = ruleResults.map(
        (result) => {
          return {
            ...result,
            severity,
          };
        },
      );

      results.push(...ruleResultsToReport);
    }

    const filteredResults = filterByCommentDirectives(
      content,
      results,
      file,
      unit.languageVersion,
    );

    return filteredResults;
  }

  private registerBuiltInRules() {
    const rules = getAllRules();

    for (const rule of rules) {
      this.ruleNameToRule.set(rule.name, rule);
    }
  }
}
