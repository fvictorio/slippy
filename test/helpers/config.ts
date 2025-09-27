import { ConfigLoader, ResolvedRuleConfig } from "../../src/config.js";

export function mockSingleRuleConfigLoader(
  ruleName: string,
  ruleConfig?: any[],
): ConfigLoader {
  return {
    loadConfig: () => {
      const ruleConfigArray: ResolvedRuleConfig =
        ruleConfig === undefined ? ["error"] : ["error", ...ruleConfig];
      return {
        files: [],
        ignores: [],
        rules: {
          [ruleName]: ruleConfigArray,
        },
      };
    },
  };
}

export function mockConfigLoaderWithRules(
  rules: Record<string, ResolvedRuleConfig>,
): ConfigLoader {
  return {
    loadConfig: () => {
      return {
        files: [],
        ignores: [],
        rules,
      };
    },
  };
}

export function mockEmptyConfigLoader(): ConfigLoader {
  return {
    loadConfig: () => ({
      files: [],
      ignores: [],
      rules: {},
    }),
  };
}
