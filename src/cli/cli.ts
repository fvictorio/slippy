#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import process from "node:process";
import url from "node:url";
import fg from "fast-glob";
import minimist from "minimist";
import { formatAndPrintResults } from "../formatter.js";
import chalk from "chalk";
import {
  SlippyDirectoriesNotSupportedError,
  SlippyError,
  SlippyNonexistentConfigPathError,
  SlippyUnmatchedPatternError,
} from "../errors.js";
import { exists, findUp, isDirectory } from "../helpers/fs.js";
import { RunLinterSuccess, RunLinterWorker } from "./worker.js";
import { initConfig } from "./init.js";
import workerpool from "workerpool";
import { existsSync } from "node:fs";

async function main() {
  try {
    const exitCode = await runCli();
    process.exit(exitCode);
  } catch (error) {
    if (SlippyError.isSlippyError(error)) {
      console.error(chalk.red("[slippy]"), error.message);
      if (error.hint !== undefined) {
        console.error();
        console.error(`${chalk.bold("Hint")}: ${error.hint}`);
      }
      process.exit(1);
    }

    const slippyVersion = await getSlippyVersion();
    console.error(
      chalk.red("[slippy]"),
      `Unexpected error, please report this issue: https://github.com/fvictorio/slippy/issues/new?body=${encodeURIComponent(`Slippy: ${slippyVersion}\nNode: ${process.version}`)}`,
    );
    console.error();
    throw error;
  }
}

interface Argv {
  help: boolean;
  init: boolean;
  version: boolean;
  config: string | undefined;
}

async function runCli(): Promise<number> {
  const unknownArgs: string[] = [];
  const argv = minimist<Argv>(process.argv.slice(2), {
    boolean: ["help", "init", "version"],
    alias: { h: "help" },
    string: ["config"],
    unknown: (arg) => {
      if (arg.startsWith("-")) {
        unknownArgs.push(arg);
        return false;
      }

      return true;
    },
  });

  const rawSourceIds: string[] = (
    await Promise.all(
      argv._.map(async (arg) => {
        const matches = await fg.async(arg);
        if (matches.length === 0) {
          const asAbsolutePath = path.resolve(process.cwd(), arg);
          if (
            (await exists(asAbsolutePath)) &&
            (await isDirectory(asAbsolutePath))
          ) {
            throw new SlippyDirectoriesNotSupportedError(arg);
          }
          throw new SlippyUnmatchedPatternError(arg);
        }

        return matches;
      }),
    )
  ).flat();

  const sourceIds = [...new Set(rawSourceIds)];

  if (unknownArgs.length > 0) {
    console.error(`Unexpected argument ${unknownArgs[0]}`);
    console.error();
    printShortHelp({ error: true });
    return 1;
  }

  if (argv.help) {
    printHelp({ error: false });
    return 0;
  }

  if (argv.version) {
    await printVersion();
    return 0;
  }

  if (argv.init) {
    await initConfig();
    return 0;
  }

  if (sourceIds.length === 0) {
    printHelp({ error: false });
    return 0;
  }

  // validate that the config path exists
  const configPath =
    argv.config !== undefined ? resolveConfigPath(argv.config) : undefined;

  const pool = workerpool.pool(
    url.fileURLToPath(new URL("./worker.js", import.meta.url)),
  );

  const results: RunLinterSuccess[] = await Promise.all(
    sourceIds.map(async (sourceId) => {
      const result = await pool.exec<RunLinterWorker>("runLinter", [
        sourceId,
        configPath,
      ]);
      if ("lintResults" in result) {
        return result;
      } else {
        // This can cause non-deterministic behavior if two files throw different errors:
        // a user could see one of the errors on one run and the other error on another run.
        // This can be fixed by using Promise.allSettled instead of Promise.all,
        // but that means that all workers have to finish before the error is shown.
        // For now, we just throw the error.
        throw new SlippyError(result.message, result.code, result.hint);
      }
    }),
  ).then(
    async (x) => {
      await pool.terminate();
      return x;
    },
    async (e) => {
      await pool.terminate();
      throw e;
    },
  );

  const sortedResults = results
    .flatMap((x) => x.lintResults)
    .sort((a, b) => {
      if (a.sourceId !== b.sourceId) {
        return a.sourceId.localeCompare(b.sourceId);
      }
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      return a.column - b.column;
    });

  let sourceIdToAbsolutePath: Record<string, string> = {};
  for (const result of results) {
    sourceIdToAbsolutePath = {
      ...sourceIdToAbsolutePath,
      ...result.sourceIdToAbsolutePath,
    };
  }

  formatAndPrintResults(sortedResults, sourceIdToAbsolutePath);

  const exitCode = sortedResults.some((result) => result.severity === "error")
    ? 1
    : 0;

  return exitCode;
}

async function getSlippyVersion(): Promise<string> {
  const packageJsonPath = await findUp("package.json", import.meta.dirname);
  if (packageJsonPath === undefined) {
    return "unknown";
  }

  const packageJsonContents = await fs.readFile(packageJsonPath, "utf8");

  const packageJson = JSON.parse(packageJsonContents) as { version?: string };

  return packageJson.version ?? "unknown";
}

function printShortHelp({ error }: { error: boolean }) {
  console[error ? "error" : "log"](
    `${chalk.bold("Usage")}: slippy [OPTIONS] <file>...`,
  );
}

function printHelp({ error }: { error: boolean }) {
  printShortHelp({ error });
  console[error ? "error" : "log"](
    `
${chalk.bold("Options")}:
  --config <path>   Use the specified config file
  --help, -h        Show this help message
  --init            Initialize a new Slippy configuration
  --version         Print version
`.trimEnd(),
  );
}

async function printVersion() {
  const version = await getSlippyVersion();
  console.log(`slippy ${version}`);
}

function resolveConfigPath(configPath: string): string {
  const asAbsolutePath = path.resolve(process.cwd(), configPath);

  if (!existsSync(asAbsolutePath)) {
    throw new SlippyNonexistentConfigPathError(configPath);
  }

  return asAbsolutePath;
}

await main();
