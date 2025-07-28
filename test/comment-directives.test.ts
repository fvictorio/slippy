import { describe, it, expect } from "vitest";
import { extractCommentDirectives } from "../src/comment-directives.js";
import { LanguageFacts } from "@nomicfoundation/slang/utils";

const oc = (x: any) => expect.objectContaining(x);

const languageVersion = LanguageFacts.latestVersion();

describe("extractCommentDirectives", function () {
  describe("slippy-disabled-next-line", function () {
    it("should return an empty array for content without directives", () => {
      const content = `
            contract A {
                uint public a;
            }
        `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([]);
    });

    it("should extract disable-next-line directives", () => {
      const content = `
            // slippy-disable-next-line
            contract A {
                uint public a;
            }
        `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable-next-line",
          disabledLine: 2,
          disabledRules: [],
        }),
      ]);
    });

    it("should extract disabled rule names", () => {
      const content = `
            // slippy-disable-next-line rule1
            contract A {
                // slippy-disable-next-line
                uint public a;
                // slippy-disable-next-line rule1, rule2
            }
        `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable-next-line",
          disabledLine: 2,
          disabledRules: ["rule1"],
        }),
        oc({
          marker: "slippy-disable-next-line",
          disabledLine: 4,
          disabledRules: [],
        }),
        oc({
          marker: "slippy-disable-next-line",
          disabledLine: 6,
          disabledRules: ["rule1", "rule2"],
        }),
      ]);
    });
  });

  describe("slippy-disable-line", function () {
    it("should extract disable-line directives", () => {
      const content = `
        contract A {
            uint public a; // slippy-disable-line
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable-line",
          disabledLine: 2,
          disabledRules: [],
        }),
      ]);
    });

    it("should extract disabled rule names for disable-line", () => {
      const content = `
                contract A {
                    uint public a; // slippy-disable-line rule1
                    uint public b; // slippy-disable-line rule2, rule3
                }
            `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable-line",
          disabledLine: 2,
          disabledRules: ["rule1"],
        }),
        oc({
          marker: "slippy-disable-line",
          disabledLine: 3,
          disabledRules: ["rule2", "rule3"],
        }),
      ]);
    });
  });

  describe("slippy-disable-previous-line", function () {
    it("should extract disable-previous-line directives", () => {
      const content = `
        contract A {
            uint public a;
            // slippy-disable-previous-line
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable-previous-line",
          disabledLine: 2,
          disabledRules: [],
        }),
      ]);
    });

    it("should extract disabled rule names for disable-previous-line", () => {
      const content = `
                contract A {
                    uint public a;
                    // slippy-disable-previous-line rule1
                    uint public b;
                    // slippy-disable-previous-line rule2, rule3
                }
            `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable-previous-line",
          disabledLine: 2,
          disabledRules: ["rule1"],
        }),
        oc({
          marker: "slippy-disable-previous-line",
          disabledLine: 4,
          disabledRules: ["rule2", "rule3"],
        }),
      ]);
    });
  });

  describe("slippy-disable and slippy-enable", function () {
    it("should extract line comment disable directives without rules", () => {
      const content = `
        // slippy-disable
        contract A {
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable",
          endLine: 1,
          endColumn: 25,
          disabledRules: [],
        }),
      ]);
    });

    it("should extract multiline comment disable directives without rules", () => {
      const content = `
        /* slippy-disable */
        contract A {
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({ marker: "slippy-disable", endLine: 1, disabledRules: [] }),
      ]);
    });

    it("should extract line comment disable directives with rules", () => {
      const content = `
        // slippy-disable rule1
        contract A {
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({ marker: "slippy-disable", endLine: 1, disabledRules: ["rule1"] }),
      ]);
    });

    it("should extract multiline comment disable directives with rules", () => {
      const content = `
        /* slippy-disable rule1,rule2 */
        contract A {
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-disable",
          endLine: 1,
          disabledRules: ["rule1", "rule2"],
        }),
      ]);
    });

    it("should extract line comment enable directives without rules", () => {
      const content = `
        contract A {
          // slippy-enable
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({ marker: "slippy-enable", endLine: 2, enabledRules: [] }),
      ]);
    });

    it("should extract multiline comment enable directives without rules", () => {
      const content = `
        /* slippy-enable */
        contract A {
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({ marker: "slippy-enable", endLine: 1, enabledRules: [] }),
      ]);
    });

    it("should extract line comment enable directives with rules", () => {
      const content = `
        // slippy-enable rule1
        contract A {
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({ marker: "slippy-enable", endLine: 1, enabledRules: ["rule1"] }),
      ]);
    });

    it("should extract multiline comment enable directives with rules", () => {
      const content = `
        /* slippy-enable rule1,	rule2 */
        contract A {
            uint public a;
        }
      `;
      const directives = extractCommentDirectives(content, languageVersion);
      expect(directives).toEqual([
        oc({
          marker: "slippy-enable",
          endLine: 1,
          enabledRules: ["rule1", "rule2"],
        }),
      ]);
    });
  });
});
