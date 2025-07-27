import {
  CompilationUnit,
  File as SlangFile,
} from "@nomicfoundation/slang/compilation";
import * as z from "zod";

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

export type RuleDefinition<Config> =
  | RuleDefinitionWithConfig<Config>
  | RuleDefinitionWithoutConfig;

export interface RuleDefinitionWithConfig<Config> {
  name: string;
  recommended: boolean;
  parseConfig: (config: unknown) => Config;
  create: (config: Config) => RuleWithConfig<Config>;
}

export interface RuleDefinitionWithoutConfig {
  name: string;
  recommended: boolean;
  create: () => RuleWithoutConfig;
}

export interface RuleWithoutConfig {
  name: string;
  run: (context: RuleContext) => LintResult[];
}

export interface RuleWithConfig<Config> extends RuleWithoutConfig {
  config: Config;
}

export interface SourceFile {
  filePath: string;
  content: string;
}

export const SeveritySchema = z.enum(["off", "warn", "error"]);

export type Severity = z.infer<typeof SeveritySchema>;
