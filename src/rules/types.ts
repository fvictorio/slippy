import {
  CompilationUnit,
  File as SlangFile,
} from "@nomicfoundation/slang/compilation";
import * as z from "zod";

export interface LintResult {
  diagnostics: DiagnosticToReport[];
  /** Contains the new text if fixes were applied */
  fixedContent?: string;
}

export type Range = [number, number];

interface FixChange {
  range: Range;
  replacement: string;
}

/**
 * A fix is a list of changes. These changes are assuming to be non-overlapping.
 * They don't need to be sorted.
 */
export type Fix = Array<FixChange>;

export interface Diagnostic {
  sourceId: string;
  line: number;
  column: number;
  rule: string | null;
  message: string;
  fix?: Fix;
}

export interface DiagnosticToReport extends Diagnostic {
  severity: "error" | "warn";
}

export interface RuleContext {
  unit: CompilationUnit;
  file: SlangFile;
  content: string;
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
  run: (context: RuleContext) => Diagnostic[];
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
