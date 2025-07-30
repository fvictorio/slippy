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

export function mockConfigLoaderWithRules(ruleNames: string[]): ConfigLoader {
  return {
    loadConfig: () => {
      const ruleEntries = ruleNames.map((name) => [name, ["error"]]);
      const rules = Object.fromEntries(ruleEntries);
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
