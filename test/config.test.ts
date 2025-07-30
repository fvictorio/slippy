import { describe, expect, it } from "vitest";
import {
  BasicConfigLoader,
  UserConfig,
  validateUserConfig,
} from "../src/config.js";
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
      [{ rules: { "some-rule": "off" } }],
      [
        { rules: { "some-rule": "off" } },
        { rules: { "some-other-rule": "error" } },
      ],
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

  describe("loadConfig", function () {
    it("should work with an object", function () {
      const userConfig: UserConfig = { rules: { "some-rule": "off" } };
      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/path/to/file.js");

      expect(config).toEqual({
        rules: { "some-rule": ["off"] },
      });
    });

    it("should work with an object with matching files", function () {
      const userConfig: UserConfig = {
        files: ["/path/**/*.js"],
        rules: { "some-rule": "off" },
      };
      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/path/to/file.js");

      expect(config).toEqual({
        rules: { "some-rule": ["off"] },
      });
    });

    it("should work with an object with no matching files", function () {
      const userConfig: UserConfig = {
        files: ["/path/**/*.js"],
        rules: { "some-rule": "off" },
      };
      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/other/to/file.js");

      expect(config).toEqual({
        rules: {},
      });
    });

    it("should work with an object with matching ignores", function () {
      const userConfig: UserConfig = {
        ignores: ["/path/**/*.js"],
        rules: { "some-rule": "off" },
      };
      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/path/to/file.js");

      expect(config).toEqual({
        rules: {},
      });
    });

    it("should work with an object with no matching ignores", function () {
      const userConfig: UserConfig = {
        ignores: ["/path/**/*.js"],
        rules: { "some-rule": "off" },
      };
      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/other/to/file.js");

      expect(config).toEqual({
        rules: { "some-rule": ["off"] },
      });
    });

    it("should match the right object when there are two", function () {
      const userConfig: UserConfig = [
        { files: ["/path/**/*.js"], rules: { "some-rule": "error" } },
        { files: ["/other/**/*.js"], rules: { "some-rule": "off" } },
      ];

      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/other/to/file.js");

      expect(config).toEqual({
        rules: { "some-rule": ["off"] },
      });
    });

    it("should merge the objects when there are multiple matches", function () {
      const userConfig: UserConfig = [
        { files: ["/path/**/*.js"], rules: { "some-rule": "error" } },
        { files: ["/path/to/**/*.js"], rules: { "some-other-rule": "error" } },
      ];

      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/path/to/file.js");

      expect(config).toEqual({
        rules: { "some-rule": ["error"], "some-other-rule": ["error"] },
      });
    });

    it("shouldn't merge rule options", function () {
      const userConfig: UserConfig = [
        { rules: { "some-rule": ["error", { a: 1 }] } },
        { rules: { "some-rule": ["error", { b: 2 }] } },
      ];

      const configLoader = BasicConfigLoader.create(userConfig);

      const config = configLoader.loadConfig("/path/to/file.js");

      expect(config).toEqual({
        rules: { "some-rule": ["error", { b: 2 }] },
      });
    });
  });
});
