import path from "node:path";
import fs from "node:fs/promises";
import { createConfigLoader, findSlippyConfigPath } from "../config.js";
import { Linter } from "../linter.js";
import { LintResultToReport, SourceFile } from "../rules/types.js";
import {
  SlippyError,
  SlippyErrorCode,
  SlippyFileNotFoundError,
} from "../errors.js";
import workerpool from "workerpool";

export interface RunLinterSuccess {
  lintResults: LintResultToReport[];
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
  customConfigPath?: string,
): Promise<RunLinterResult> {
  try {
    let configPath = customConfigPath;
    if (configPath === undefined) {
      configPath = await findSlippyConfigPath(process.cwd());
    }
    return await internalRunLinter(sourceId, configPath);
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
    const results = await runner.lintFiles([file]);

    return {
      lintResults: results,
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
