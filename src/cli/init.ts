import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";

import { tryFindSlippyConfigPath } from "../config.js";
import { SlippyConfigAlreadyExistsError } from "../errors.js";
import { findUp } from "../helpers/fs.js";
import { getAllRules } from "../rules/get-all-rules.js";

export async function initConfig() {
  const existingSlippyConfigPath = await tryFindSlippyConfigPath(process.cwd());
  if (existingSlippyConfigPath !== undefined) {
    throw new SlippyConfigAlreadyExistsError(existingSlippyConfigPath);
  }

  const slippyConfigPath = path.resolve(process.cwd(), "slippy.config.js");

  const packageJsonPath = await findUp("package.json", process.cwd());
  let isEsm = false;
  if (packageJsonPath !== undefined) {
    const packageJsonContents = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContents) as { type?: string };
    isEsm = packageJson.type === "module";
  }

  const lines: string[] = [];
  if (isEsm) {
    lines.push("export default {");
  } else {
    lines.push("module.exports = {");
  }
  lines.push("  rules: {");

  const allRules = getAllRules().sort((a, b) => a.name.localeCompare(b.name));

  for (const rule of allRules) {
    const severity = rule.recommended ? "error" : "off";
    lines.push(`    "${rule.name}": "${severity}",`);
  }
  lines.push("  },");
  lines.push("};");

  await fs.writeFile(slippyConfigPath, lines.join("\n"));

  console.log(
    `${chalk.green("[slippy]")} Configuration file created at ${slippyConfigPath}`,
  );
}
