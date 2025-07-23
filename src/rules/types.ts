import {
  CompilationUnit,
  File as SlangFile,
} from "@nomicfoundation/slang/compilation";

export interface LintResult {
  sourceId: string;
  line: number;
  column: number;
  rule: string | null;
  message: string;
}

export interface LintResultToReport extends LintResult {
  severity: "error" | "warn";
}

export interface RuleContext {
  unit: CompilationUnit;
  file: SlangFile;
}

export interface Rule {
  run(ctx: RuleContext): LintResult[];
}

export interface RuleClass {
  new (ruleConfig: any): Rule;
  ruleName: string;
}

export interface SourceFile {
  filePath: string;
  content: string;
}

export type RuleLevel = "off" | "warn" | "error";
