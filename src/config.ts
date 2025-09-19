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
import { conditionalUnionType } from "./zod.js";

type EffectiveConfig = Pick<ResolvedConfigObject, "rules">;

export interface ConfigLoader {
  loadConfig(filePath: string): EffectiveConfig;
}

export type ResolvedRuleConfig = [Severity, ...any[]];

const RuleConfigSchema = z.custom<Severity | [Severity, any?]>(
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

const UserConfigObjectSchema = z.strictObject({
  rules: z.record(z.string(), RuleConfigSchema).optional(),
  files: z.array(z.string()).optional(),
  ignores: z.array(z.string()).optional(),
});
type UserConfigObject = z.infer<typeof UserConfigObjectSchema>;

const UserConfigSchema = conditionalUnionType(
  [
    [(x) => Array.isArray(x), z.array(UserConfigObjectSchema).nonempty()],
    [(x) => typeof x === "object" && x !== null, UserConfigObjectSchema],
  ],
  "Configuration must be an object or an array of objects",
);

export type UserConfig = z.infer<typeof UserConfigSchema>;

type ResolvedConfigObject = {
  rules: Record<string, ResolvedRuleConfig>;
  files: string[];
  ignores: string[];
};

type ResolvedConfig = Array<ResolvedConfigObject>;

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

  if (typeof config[0] !== "string") {
    if (typeof config[0] === "number" && 0 <= config[0] && config[0] <= 2) {
      return levelAsSeverityMessage;
    }
    return "Invalid option: expected the first element to be a string";
  }

  const severity = config[0];

  const parsedSeverity = SeveritySchema.safeParse(severity);
  if (!parsedSeverity.success) {
    return invalidSeverityMessage;
  }
}

async function loadSlippyConfig(slippyConfigPath: string): Promise<unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (await import(pathToFileURL(slippyConfigPath).href)).default;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new SlippyConfigLoadingError(slippyConfigPath, error.message);
    }

    throw error;
  }
}

export async function createConfigLoader(
  configPath: string,
): Promise<ConfigLoader> {
  const userConfig = await loadSlippyConfig(configPath);

  validateUserConfig(userConfig, configPath);

  return BasicConfigLoader.create(userConfig);
}

export class BasicConfigLoader implements ConfigLoader {
  private constructor(private config: ResolvedConfig) {}

  static create(userConfig: UserConfig): BasicConfigLoader {
    const resolvedConfig: ResolvedConfig = resolveConfig(userConfig);

    return new BasicConfigLoader(resolvedConfig);
  }

  loadConfig(filePath: string): EffectiveConfig {
    const mergedConfig: EffectiveConfig = {
      rules: {},
    };

    for (const configObject of this.config) {
      if (
        configObject.ignores.length > 0 &&
        micromatch([filePath], configObject.ignores).length > 0
      ) {
        continue;
      }

      if (configObject.files.length > 0) {
        if (micromatch([filePath], configObject.files).length === 0) {
          continue;
        }
      }

      mergedConfig.rules = {
        ...mergedConfig.rules,
        ...configObject.rules,
      };
    }

    return mergedConfig;
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

  const parsedConfig = UserConfigSchema.safeParse(userConfig);
  if (parsedConfig.success) {
    return;
  }

  throw new SlippyInvalidConfigError(
    slippyConfigPath,
    "\n\n" + z.prettifyError(parsedConfig.error),
  );
}

export async function findSlippyConfigPath(cwd: string): Promise<string> {
  const configPath = await findUp("slippy.config.js", cwd);
  if (configPath === undefined) {
    throw new SlippyConfigNotFoundError();
  }

  return configPath;
}

function resolveConfig(userConfig: UserConfig): ResolvedConfig {
  if (Array.isArray(userConfig)) {
    return userConfig.map(resolveConfigObject);
  }

  return [resolveConfigObject(userConfig)];
}

function resolveConfigObject(
  userConfigObject: UserConfigObject,
): ResolvedConfigObject {
  const rules: Record<string, ResolvedRuleConfig> = {};
  for (const [ruleName, ruleConfig] of Object.entries(
    userConfigObject.rules ?? {},
  )) {
    if (typeof ruleConfig === "string") {
      rules[ruleName] = [ruleConfig];
    } else {
      rules[ruleName] = ruleConfig;
    }
  }

  if (
    userConfigObject.files !== undefined &&
    userConfigObject.files.length === 0
  ) {
    throw new SlippyInvalidConfigError(
      "slippy.config.js",
      "If a configuration includes a `files` property, it must not be an empty array",
    );
  }

  return {
    rules,
    ignores: userConfigObject.ignores ?? [],
    files: userConfigObject.files ?? [],
  };
}
