import path from "node:path";
import fs from "node:fs/promises";
import { createConfigLoader } from "../config.js";
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
): Promise<RunLinterResult> {
  try {
    return await internalRunLinter(sourceId);
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

async function internalRunLinter(sourceId: string): Promise<RunLinterSuccess> {
  const configLoader = await createConfigLoader(process.cwd());

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
