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
        oc({ kind: "disable-next-line", disabledLine: 2, disabledRules: [] }),
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
          kind: "disable-next-line",
          disabledLine: 2,
          disabledRules: ["rule1"],
        }),
        oc({
          kind: "disable-next-line",
          disabledLine: 4,
          disabledRules: [],
        }),
        oc({
          kind: "disable-next-line",
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
        oc({ kind: "disable-line", disabledLine: 2, disabledRules: [] }),
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
          kind: "disable-line",
          disabledLine: 2,
          disabledRules: ["rule1"],
        }),
        oc({
          kind: "disable-line",
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
          kind: "disable-previous-line",
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
          kind: "disable-previous-line",
          disabledLine: 2,
          disabledRules: ["rule1"],
        }),
        oc({
          kind: "disable-previous-line",
          disabledLine: 4,
          disabledRules: ["rule2", "rule3"],
        }),
      ]);
    });
  });
});
