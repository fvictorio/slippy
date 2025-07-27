import { pathToFileURL } from "node:url";
import micromatch from "micromatch";
import { z } from "zod";
import { findUp } from "./helpers/fs.js";
import { Severity, SeveritySchema } from "./rules/types.js";
import {
  SlippyConfigLoadingError,
  SlippyConfigNotFoundError,
  SlippyInvalidConfigError,
} from "./errors.js";

export type ResolvedRuleConfig = [Severity, ...any[]];

function validateRuleConfig(config: unknown): string | undefined {
  const invalidSeverityMessage = `Invalid option: expected severity to be "off", "warn", or "error"`;
  const levelAsSeverityMessage = `Invalid option: severity can't be specified as a number, use one of "off", "warn", or "error"`;

  if (typeof config === "string") {
    const parsedConfig = SeveritySchema.safeParse(config);
    if (!parsedConfig.success) {
      return invalidSeverityMessage;
    }

    return;
  }

  if (!Array.isArray(config)) {
    if (typeof config === "number" && 0 <= config && config <= 2) {
      return levelAsSeverityMessage;
    }
    return "Invalid option: expected a string or an array";
  }

  if (config.length === 0) {
    return "Invalid option: expected a non-empty array";
  }

  if (config.length > 2) {
    return "Invalid option: expected an array with at most two elements";
  }

  const severity = config[0];
  if (typeof severity !== "string") {
    if (typeof severity === "number" && 0 <= severity && severity <= 2) {
      return levelAsSeverityMessage;
    }
    return "Invalid option: expected the first element to be a string";
  }

  const parsedSeverity = SeveritySchema.safeParse(severity);
  if (!parsedSeverity.success) {
    return invalidSeverityMessage;
  }
}

const RuleConfigSchema = z.custom<Severity | [Severity, any]>(
  (val) => {
    const error = validateRuleConfig(val);
    return error === undefined;
  },
  {
    error: (ctx) => {
      return {
        message: validateRuleConfig(ctx.input) ?? "Invalid rule configuration",
      };
    },
  },
);

const UserConfigSchema = z.strictObject({
  rules: z.record(z.string(), RuleConfigSchema).optional(),
  ignores: z.array(z.string()).optional(),
});

export type UserConfig = z.infer<typeof UserConfigSchema>;

interface ResolvedConfig {
  rules: Record<string, ResolvedRuleConfig>;
  ignores: string[];
}

export interface ConfigLoader {
  loadConfig(filePath: string): ResolvedConfig | undefined;
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

  return new BasicConfigLoader(resolvedConfig);
}

export class BasicConfigLoader implements ConfigLoader {
  constructor(private config: ResolvedConfig) {}

  loadConfig(filePath: string) {
    if (
      this.config.ignores.length > 0 &&
      micromatch([filePath], this.config.ignores).length > 0
    ) {
      return undefined;
    }
    return this.config;
  }
}

export function validateUserConfig(
  userConfig: unknown,
  slippyConfigPath: string,
): asserts userConfig is UserConfig {
  if (userConfig === undefined) {
    throw new SlippyInvalidConfigError(
      slippyConfigPath,
      "Configuration must be an object",
      "Did you forget to export the config?",
    );
  }

  if (Array.isArray(userConfig)) {
    throw new SlippyInvalidConfigError(
      slippyConfigPath,
      "Configurations as arrays are not supported yet",
    );
  }

  const parsedConfig = UserConfigSchema.safeParse(userConfig);
  if (parsedConfig.success) {
    return;
  }

  throw new SlippyInvalidConfigError(
    slippyConfigPath,
    "\n\n" + z.prettifyError(parsedConfig.error),
  );
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
  return { rules, ignores: userConfig.ignores ?? [] };
}
