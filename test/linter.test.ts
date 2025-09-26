import { describe, it, expect } from "vitest";
import { Linter } from "../src/linter.js";
import {
  mockConfigLoaderWithRules,
  mockEmptyConfigLoader,
  mockSingleRuleConfigLoader,
} from "./helpers/config.js";
import { BasicConfigLoader } from "../src/config.js";

describe("linter", function () {
  it("should show parsing errors", async function () {
    const sources = `
        contract A {
      `;

    const linter = new Linter(mockEmptyConfigLoader());

    const diagnostics = await linter.lintText(sources, "contract.sol");

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].rule).toBeNull();
    expect(diagnostics[0].message).toBe("Parsing error");
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

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(0);
    });

    it("should respect disable-line directives", async function () {
      const sources = `
        contract A {
            uint public a; // slippy-disable-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(0);
    });

    it("should respect disable-previous-line directives", async function () {
      const sources = `
        contract A {
            uint public a;
            // slippy-disable-previous-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(0);
    });

    it("should warn about unused disable-next-line directive", async function () {
      const sources = `
        contract A {
            // slippy-disable-next-line explicit-types
            uint256 public a;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(2);
      expect(diagnostics[0].column).toBe(12);
    });

    it("should warn about unused disable-line directive", async function () {
      const sources = `
        contract A {
            uint256 public a; // slippy-disable-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(2);
      expect(diagnostics[0].column).toBe(30);
    });

    it("should warn about unused disable-previous-line directive", async function () {
      const sources = `
        contract A {
            uint256 public a;
            // slippy-disable-previous-line explicit-types
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(3);
      expect(diagnostics[0].column).toBe(12);
    });

    it("should warn about unused disable--line directives rules", async function () {
      const sources = `
        contract A {
          function f() public {
            uint256 a; // slippy-disable-line explicit-types, no-unused-vars
          }
        }
      `;

      const linter = new Linter(
        mockConfigLoaderWithRules(["explicit-types", "no-unused-vars"]),
      );

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable-line directive (no problems were reported from 'explicit-types')"`,
      );
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

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0].rule).toBe("explicit-types");
      expect(diagnostics[0].line).toBe(3);
      expect(diagnostics[1].rule).toBe("explicit-types");
      expect(diagnostics[1].line).toBe(4);
    });

    it("should handle disable directive without rules", async function () {
      const sources = `
        contract A {
            uint public x;
            uint public y;
            // slippy-disable
            uint public z;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0].rule).toBe("explicit-types");
      expect(diagnostics[0].line).toBe(2);
      expect(diagnostics[1].rule).toBe("explicit-types");
      expect(diagnostics[1].line).toBe(3);
    });

    it("should handle disable directive with rules", async function () {
      const sources = `
        contract A {
            function f() public {
              // slippy-disable explicit-types
              uint x;
            }
        }
      `;

      const linter = new Linter(
        mockConfigLoaderWithRules(["explicit-types", "no-unused-vars"]),
      );

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBe("no-unused-vars");
      expect(diagnostics[0].line).toBe(4);
    });

    it("should handle enable directive without rules", async function () {
      const sources = `
        contract A {
            function f() public {
              // slippy-disable
              uint x;
              // slippy-enable
              uint y;
              // slippy-disable
              uint z;
            }
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].line).toBe(6);
    });

    it("should handle enable directive with rules", async function () {
      const sources = `
        contract A {
            function f() public {
              // slippy-disable
              uint x;
              // slippy-enable explicit-types
              uint y;
              // slippy-enable
              uint z;
            }
        }
      `;

      const linter = new Linter(
        mockConfigLoaderWithRules(["explicit-types", "no-unused-vars"]),
      );

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(3);
      expect(diagnostics[0].rule).toBe("explicit-types");
      expect(diagnostics[0].line).toBe(6);
      expect(diagnostics[1].line).toBe(8);
      expect(diagnostics[2].line).toBe(8);
    });

    it("should report unused disable directives without rules", async function () {
      const sources = `
        // slippy-disable
        contract A {
            function f() public {
            }
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
    });
    it("should report unused disable directives with rules (one unused)", async function () {
      const sources = `
        // slippy-disable explicit-types, no-unused-vars
        contract A {
            function f() public {
              uint x;
              y = x;
            }
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported from 'no-unused-vars')"`,
      );
    });

    it("should report unused disable directives with rules (both unused)", async function () {
      const sources = `
        // slippy-disable explicit-types, no-unused-vars
        contract A {
            function f() public {
              uint256 x;
              y = x;
            }
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
    });

    it("should report unused disable directive without rules followed by another disable directive without rules", async function () {
      const sources = `
        // slippy-disable
        // slippy-disable
        contract A {
            uint public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported)"`,
      );
    });

    it("should report unused disable directive with rules followed by a disable directive without rules", async function () {
      const sources = `
        // slippy-disable explicit-types
        // slippy-disable
        contract A {
            uint public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported from 'explicit-types')"`,
      );
    });

    it("should report unused disable directive without rules followed by a disable directive with rules", async function () {
      const sources = `
        // slippy-disable
        // slippy-disable explicit-types
        contract A {
            uint public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported)"`,
      );
    });

    it("should report unused disable directive with rules followed by another disable directive with rules", async function () {
      const sources = `
        // slippy-disable explicit-types
        // slippy-disable explicit-types
        contract A {
            uint public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported from 'explicit-types')"`,
      );
    });

    it("should report two consecutive unused disable directives without rules", async function () {
      const sources = `
        // slippy-disable
        // slippy-disable
        contract A {
            uint256 public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported)"`,
      );

      expect(diagnostics[1].rule).toBeNull();
      expect(diagnostics[1].line).toBe(2);
      expect(diagnostics[1].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported)"`,
      );
    });

    it("should report two consecutive unused disable directives with rules", async function () {
      const sources = `
        // slippy-disable explicit-types
        // slippy-disable explicit-types
        contract A {
            uint256 public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported from 'explicit-types')"`,
      );

      expect(diagnostics[1].rule).toBeNull();
      expect(diagnostics[1].line).toBe(2);
      expect(diagnostics[1].message).toMatchInlineSnapshot(
        `"Unused slippy-disable directive (no problems were reported from 'explicit-types')"`,
      );
    });

    it("should report unmatched enable directives without rules", async function () {
      const sources = `
        // slippy-enable
        contract A {
            uint256 public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-enable directive (no matching slippy-disable directives were found)"`,
      );
    });

    it("should report unmatched enable directives with a rule", async function () {
      const sources = `
        // slippy-enable explicit-types
        contract A {
            uint256 public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-enable directive (no matching slippy-disable directives were found for 'explicit-types')"`,
      );
    });

    it("should report unmatched enable directives with two rules", async function () {
      const sources = `
        // slippy-enable explicit-types, no-unused-vars
        contract A {
            uint256 public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-enable directive (no matching slippy-disable directives were found for 'explicit-types' or 'no-unused-vars')"`,
      );
    });

    it("should report two unmatched enable directives", async function () {
      const sources = `
        // slippy-enable explicit-types
        // slippy-enable no-unused-vars
        contract A {
            uint256 public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0].rule).toBeNull();
      expect(diagnostics[0].line).toBe(1);
      expect(diagnostics[0].message).toMatchInlineSnapshot(
        `"Unused slippy-enable directive (no matching slippy-disable directives were found for 'explicit-types')"`,
      );
      expect(diagnostics[1].rule).toBeNull();
      expect(diagnostics[1].line).toBe(2);
      expect(diagnostics[1].message).toMatchInlineSnapshot(
        `"Unused slippy-enable directive (no matching slippy-disable directives were found for 'no-unused-vars')"`,
      );
    });

    it("should disable problem when directive is on the same line, before the node", async function () {
      const sources = `
        contract A {
            /* slippy-disable explicit-types*/ uint public x;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(0);
    });

    it("should not disable problem when directive is on the same line, after the node", async function () {
      const sources = `
        contract A {
          uint public x; /* slippy-disable explicit-types*/
          uint public y;
        }
      `;

      const linter = new Linter(mockSingleRuleConfigLoader("explicit-types"));

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBe("explicit-types");
      expect(diagnostics[0].line).toBe(2);
    });
  });

  describe("ignores", function () {
    it("should ignore files that are in the ignore list", async function () {
      const sources = `
        contract A {
          uint public a;
        }
      `;

      const configLoader = BasicConfigLoader.create({
        ignores: ["contract.sol"],
        rules: {
          "explicit-types": ["error"],
        },
      });
      const linter = new Linter(configLoader);

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(0);
    });

    it("should not ignore files that aren't in the ignore list", async function () {
      const sources = `
        contract A {
          uint public a;
        }
      `;

      const configLoader = BasicConfigLoader.create({
        ignores: ["foo.sol", "bar.sol"],
        rules: {
          "explicit-types": ["error"],
        },
      });
      const linter = new Linter(configLoader);

      const diagnostics = await linter.lintText(sources, "contract.sol");

      expect(diagnostics).toHaveLength(1);
    });

    it("should accept globs", async function () {
      const sources = `
        contract A {
          uint public a;
        }
      `;

      const configLoader = BasicConfigLoader.create({
        ignores: ["**/Mock*.sol"],
        rules: {
          "explicit-types": ["error"],
        },
      });
      const linter = new Linter(configLoader);

      const diagnostics = await linter.lintText(sources, "MockFoo.sol");

      expect(diagnostics).toHaveLength(0);
    });

    it("should ignore if one of the globs matches", async function () {
      const sources = `
        contract A {
          uint public a;
        }
      `;

      const configLoader = BasicConfigLoader.create({
        ignores: ["A*.sol", "B*.sol"],
        rules: {
          "explicit-types": ["error"],
        },
      });
      const linter = new Linter(configLoader);

      const diagnostics = await linter.lintText(sources, "Asdf.sol");

      expect(diagnostics).toHaveLength(0);
    });

    it("should allow negations", async function () {
      const sources = `
        contract A {
          uint public a;
        }
      `;

      const configLoader = BasicConfigLoader.create({
        ignores: ["contract/mocks/**/*.sol", "!contracts/mocks/MockFoo.sol"],
        rules: {
          "explicit-types": ["error"],
        },
      });
      const linter = new Linter(configLoader);

      const diagnostics = await linter.lintText(
        sources,
        "contracts/mocks/MockFoo.sol",
      );

      expect(diagnostics).toHaveLength(1);
    });
  });
});
