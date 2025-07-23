import { describe, it, expect } from "vitest";
import { Linter } from "../src/linter.js";
import {
  mockEmptyConfigLoader,
  mockSingleRuleConfigLoader,
} from "./helpers/config.js";

describe("linter", function () {
  it("should show parsing errors", async function () {
    const sources = `
        contract A {
      `;

    const linter = new Linter(mockEmptyConfigLoader());

    const results = await linter.lintText(sources, "contract.sol");

    expect(results).toHaveLength(1);
    expect(results[0].rule).toBeNull();
    expect(results[0].message).toBe("Parsing error");
  });

  describe("comment directives", function () {
    it("should respect disable-next-line directives", async function () {
      const sources = `
        contract A {
            // slippy-disable-next-line explicit-types
            uint public a;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const results = await linter.lintText(sources, "contract.sol");

      expect(results).toHaveLength(0);
    });

    it("should respect disable-line directives", async function () {
      const sources = `
        contract A {
            uint public a; // slippy-disable-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const results = await linter.lintText(sources, "contract.sol");

      expect(results).toHaveLength(0);
    });

    it("should respect disable-previous-line directives", async function () {
      const sources = `
        contract A {
            uint public a;
            // slippy-disable-previous-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const results = await linter.lintText(sources, "contract.sol");

      expect(results).toHaveLength(0);
    });

    it("should warn about unused disable-next-line directive", async function () {
      const sources = `
        contract A {
            // slippy-disable-next-line explicit-types
            uint256 public a;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const results = await linter.lintText(sources, "contract.sol");

      expect(results).toHaveLength(1);
      expect(results[0].rule).toBeNull();
      expect(results[0].line).toBe(2);
      expect(results[0].column).toBe(12);
    });

    it("should warn about unused disable-line directive", async function () {
      const sources = `
        contract A {
            uint256 public a; // slippy-disable-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const results = await linter.lintText(sources, "contract.sol");

      expect(results).toHaveLength(1);
      expect(results[0].rule).toBeNull();
      expect(results[0].line).toBe(2);
      expect(results[0].column).toBe(30);
    });

    it("should warn about unused disable-previous-line directive", async function () {
      const sources = `
        contract A {
            uint256 public a;
            // slippy-disable-previous-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const results = await linter.lintText(sources, "contract.sol");

      expect(results).toHaveLength(1);
      expect(results[0].rule).toBeNull();
      expect(results[0].line).toBe(3);
      expect(results[0].column).toBe(12);
    });

    it("should report two out of three problems", async function () {
      const sources = `
        contract A {
            uint public x; // slippy-disable-line
            uint public y;
            uint public z;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const results = await linter.lintText(sources, "contract.sol");

      expect(results).toHaveLength(2);
      expect(results[0].rule).toBe("explicit-types");
      expect(results[0].line).toBe(3);
      expect(results[1].rule).toBe("explicit-types");
      expect(results[1].line).toBe(4);
    });
  });
});
