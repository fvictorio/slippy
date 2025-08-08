import fs from "fs";
import { describe, expect, it } from "vitest";
import { getAllRules } from "../src/rules/get-all-rules.js";
import path from "path";
import { Linter } from "../src/linter.js";
import { mockSingleRuleConfigLoader } from "./helpers/config.js";

interface Example {
  source: string;
  correct: boolean;
}

describe("rules examples", async function () {
  const rules = getAllRules();

  for (const rule of rules) {
    const markdownContent = fs
      .readFileSync(
        path.join(
          import.meta.dirname,
          "..",
          "docs",
          "rules",
          `${rule.name}.md`,
        ),
      )
      .toString();

    const examples = extractExamples(markdownContent);

    // sanity check: all rules should have at least one example
    expect(examples.length).toBeGreaterThan(0);

    for (const example of examples) {
      it(`${example.correct ? "correct" : "incorrect"} example for rule ${rule.name}`, async function () {
        const linter = new Linter(mockSingleRuleConfigLoader(rule.name));

        const results = await linter.lintText(example.source, "contract.sol");

        if (example.correct) {
          expect(results).toEqual([]);
        } else {
          expect(results).not.toEqual([]);
        }
      });
    }
  }
});

function extractExamples(content: string): Example[] {
  const EXAMPLES_REGEX =
    /Examples of \*\*(correct|incorrect)\*\* code[\s\S]*?```solidity([\s\S]*?)```/g;
  const examples: Example[] = [];

  let match;
  while ((match = EXAMPLES_REGEX.exec(content)) !== null) {
    examples.push({
      source: match[2].trim(),
      correct: match[1] === "correct",
    });
  }

  return examples;
}
