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
        ignores: [],
        rules: {
          [ruleName]: ruleConfigArray,
        },
      };
    },
  };
}

export function mockEmptyConfigLoader(): ConfigLoader {
  return {
    loadConfig: () => ({
      ignores: [],
      rules: {},
    }),
  };
}
