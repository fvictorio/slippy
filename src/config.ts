import { pathToFileURL } from "node:url";
import { findUp } from "./helpers/fs.js";
import { RuleLevel } from "./rules/types.js";
import {
  SlippyConfigLoadingError,
  SlippyConfigNotFoundError,
  SlippyInvalidConfigError,
} from "./errors.js";

type UserRuleConfig = RuleLevel | ResolvedRuleConfig;
export type ResolvedRuleConfig = [RuleLevel, ...any[]];

export interface UserConfig {
  rules?: Record<string, UserRuleConfig>;
}

interface ResolvedConfig {
  rules: Record<string, ResolvedRuleConfig>;
}

export interface ConfigLoader {
  loadConfig(filePath: string): ResolvedConfig;
}

async function loadSlippyConfig(slippyConfigPath: string): Promise<unknown> {
  try {
    return (await import(pathToFileURL(slippyConfigPath).href)).default;
  } catch (error: any) {
    throw new SlippyConfigLoadingError(slippyConfigPath, error.message);
  }
}

export async function createConfigLoader(cwd: string): Promise<ConfigLoader> {
  const slippyConfigPath = await findSlippyConfigPath(cwd);
  if (slippyConfigPath === undefined) {
    throw new SlippyConfigNotFoundError();
  }

  const userConfig = await loadSlippyConfig(slippyConfigPath);

  validateUserConfig(userConfig, slippyConfigPath);

  const resolvedConfig: ResolvedConfig = resolveConfig(userConfig);

  return {
    loadConfig: () => resolvedConfig,
  };
}

export function validateUserConfig(
  userConfig: unknown,
  slippyConfigPath: string,
): asserts userConfig is UserConfig {
  if (typeof userConfig !== "object" || userConfig === null) {
    const hint =
      userConfig === undefined
        ? "Did you forget to export the config?"
        : undefined;
    throw new SlippyInvalidConfigError(
      slippyConfigPath,
      "Configuration must be an object",
      hint,
    );
  }

  if (Array.isArray(userConfig)) {
    throw new SlippyInvalidConfigError(
      slippyConfigPath,
      "Configurations as arrays are not supported yet",
    );
  }

  const validKeys = ["rules"];
  const keys = Object.keys(userConfig).filter((x) => !validKeys.includes(x));

  if (keys.length > 0) {
    throw new SlippyInvalidConfigError(
      slippyConfigPath,
      `Invalid configuration ${keys.length > 1 ? "keys" : "key"}: ${keys.join(", ")}`,
    );
  }

  if ("rules" in userConfig) {
    const rules = userConfig.rules;
    if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
      throw new SlippyInvalidConfigError(
        slippyConfigPath,
        "config.rules must be an object",
      );
    }

    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      if (typeof ruleConfig !== "string" && !Array.isArray(ruleConfig)) {
        throw new SlippyInvalidConfigError(
          slippyConfigPath,
          `Invalid configuration for rule '${ruleName}': must be a string or an array`,
        );
      }

      const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
      if (!["off", "warn", "error"].includes(severity)) {
        throw new SlippyInvalidConfigError(
          slippyConfigPath,
          `Invalid severity for rule '${ruleName}': must be 'off', 'warn', or 'error'`,
        );
      }
    }
  }
}

export async function findSlippyConfigPath(
  cwd: string,
): Promise<string | undefined> {
  return findUp("slippy.config.js", cwd);
}

function resolveConfig(userConfig: UserConfig): ResolvedConfig {
  const rules: Record<string, ResolvedRuleConfig> = {};
  for (const [ruleName, ruleConfig] of Object.entries(userConfig.rules ?? {})) {
    if (typeof ruleConfig === "string") {
      rules[ruleName] = [ruleConfig];
    } else {
      rules[ruleName] = ruleConfig;
    }
  }
  return { rules };
}
