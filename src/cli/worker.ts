import path from "node:path";
import fs from "node:fs/promises";
import { createConfigLoader, findSlippyConfigPath } from "../config.js";
import { Linter } from "../linter.js";
import { DiagnosticToReport, SourceFile } from "../rules/types.js";
import {
  SlippyError,
  SlippyErrorCode,
  SlippyFileNotFoundError,
} from "../errors.js";
import workerpool from "workerpool";

export interface RunLinterSuccess {
  diagnostics: DiagnosticToReport[];
  sourceIdToAbsolutePath: Record<string, string>;
}

interface RunLinterError {
  code: SlippyErrorCode;
  message: string;
  hint?: string;
}

export type RunLinterResult = RunLinterSuccess | RunLinterError;

export default async function runLinter(
  sourceId: string,
  fix: boolean,
  customConfigPath?: string,
): Promise<RunLinterResult> {
  try {
    let configPath = customConfigPath;
    if (configPath === undefined) {
      configPath = await findSlippyConfigPath(process.cwd());
    }
    return await internalRunLinter(sourceId, configPath, fix);
  } catch (error) {
    if (SlippyError.isSlippyError(error)) {
      return {
        code: error.code,
        message: error.message,
        hint: error.hint,
      };
    }
    throw error;
  }
}

async function internalRunLinter(
  sourceId: string,
  configPath: string,
  fix: boolean,
): Promise<RunLinterSuccess> {
  const configLoader = await createConfigLoader(configPath);

  const sourceIdToAbsolutePath: Record<string, string> = {};
  const runner = new Linter(configLoader);
  try {
    const absolutePath = path.resolve(process.cwd(), sourceId);
    sourceIdToAbsolutePath[sourceId] = absolutePath;
    const file: SourceFile = {
      filePath: sourceId,
      content: await fs.readFile(absolutePath, "utf8"),
    };
    const [lintResult] = await runner.lintFiles([file], { fix });

    if (fix && lintResult.fixedContent !== undefined) {
      await fs.writeFile(absolutePath, lintResult.fixedContent);
    }

    return {
      diagnostics: lintResult.diagnostics,
      sourceIdToAbsolutePath,
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new SlippyFileNotFoundError(sourceId);
    }

    throw error;
  }
}

export type RunLinterWorker = typeof runLinter;

workerpool.worker({
  runLinter,
});
