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

  describe("error messages", function () {
    const parseAndReturnErrorMessage = (config: unknown) => {
      try {
        validateUserConfig(config, "/path/to/config.js");
      } catch (error: any) {
        return error;
      }
    };

    it("undefined config", function () {
      const error = parseAndReturnErrorMessage(undefined);

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(
        `"Invalid config at '/path/to/config.js': Configuration must be an object"`,
      );
      expect(error.hint).toMatchInlineSnapshot(
        `"Did you forget to export the config?"`,
      );
    });

    it("unknown key", function () {
      const error = parseAndReturnErrorMessage({ invalidKey: {} });

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(`
        "Invalid config at '/path/to/config.js': 

        ✖ Unrecognized key: "invalidKey""
      `);
    });

    it("wrong severity, shorthand version", function () {
      const error = parseAndReturnErrorMessage({
        rules: { "some-rule": "erro" },
      });

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(`
        "Invalid config at '/path/to/config.js': 

        ✖ Invalid option: expected severity to be "off", "warn", or "error"
          → at rules["some-rule"]"
      `);
    });

    it("wrong severity, array version", function () {
      const error = parseAndReturnErrorMessage({
        rules: { "some-rule": ["erro"] },
      });

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(`
        "Invalid config at '/path/to/config.js': 

        ✖ Invalid option: expected severity to be "off", "warn", or "error"
          → at rules["some-rule"]"
      `);
    });

    it("rule config is empty array", function () {
      const error = parseAndReturnErrorMessage({ rules: { "some-rule": [] } });

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(`
        "Invalid config at '/path/to/config.js': 

        ✖ Invalid option: expected a non-empty array
          → at rules["some-rule"]"
      `);
    });

    it("rule config is array with more than two elements", function () {
      const error = parseAndReturnErrorMessage({
        rules: { "some-rule": ["error", {}, {}] },
      });

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(`
        "Invalid config at '/path/to/config.js': 

        ✖ Invalid option: expected an array with at most two elements
          → at rules["some-rule"]"
      `);
    });

    it("severity as a level, shorthand", function () {
      const error = parseAndReturnErrorMessage({ rules: { "some-rule": 1 } });

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(`
        "Invalid config at '/path/to/config.js': 

        ✖ Invalid option: severity can't be specified as a number, use one of "off", "warn", or "error"
          → at rules["some-rule"]"
      `);
    });

    it("severity as a level", function () {
      const error = parseAndReturnErrorMessage({ rules: { "some-rule": [1] } });

      expect(error).instanceOf(SlippyInvalidConfigError);
      expect(error.message).toMatchInlineSnapshot(`
        "Invalid config at '/path/to/config.js': 

        ✖ Invalid option: severity can't be specified as a number, use one of "off", "warn", or "error"
          → at rules["some-rule"]"
      `);
    });
  });
});
