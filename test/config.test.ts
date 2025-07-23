import { describe, expect, it } from "vitest";
import { validateUserConfig } from "../src/config.js";
import { SlippyInvalidConfigError } from "../src/errors.js";

describe("config", function () {
  it("should report invalid configs", function () {
    const invalidConfigs = [
      undefined,
      null,
      1,
      [],
      { invalidKey: {} },
      { rules: 1 },
      { rules: [] },
      { rules: { "some-rule": 1 } },
      { rules: { "some-rule": [] } },
      { rules: { "some-rule": "invalid-severity" } },
      { rules: { "some-rule": ["invalid-severity"] } },
    ];

    for (const config of invalidConfigs) {
      expect(() => {
        validateUserConfig(config, "/path/to/config.js");
      }).toThrowError(SlippyInvalidConfigError);
    }
  });

  it("should accept valid configs", function () {
    const validConfigs = [
      {},
      { rules: {} },
      { rules: { "some-rule": "off" } },
      { rules: { "some-rule": "warn" } },
      { rules: { "some-rule": "error" } },
      { rules: { "some-rule": ["warn"] } },
      { rules: { "some-rule": ["error"] } },
      { rules: { "some-rule": ["off"] } },
      { rules: { "some-rule": ["warn", { option: true }] } },
      { rules: { "some-rule": ["error", { option: true }] } },
      { rules: { "some-rule": ["off", { option: true }] } },
    ];

    for (const config of validConfigs) {
      validateUserConfig(config, "/path/to/config.js");
    }
  });
});
