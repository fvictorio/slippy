import fs from "fs";
import { describe, expect, it } from "vitest";
import { getAllRules } from "../src/rules/get-all-rules.js";
import path from "path";
import { Linter } from "../src/linter.js";
import { mockSingleRuleConfigLoader } from "./helpers/config.js";

interface Example {
  source: string;
  correct: boolean;
  config: any;
}

describe("rules examples", function () {
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
        const linter = new Linter(
          mockSingleRuleConfigLoader(
            rule.name,
            example.config !== undefined ? [example.config] : undefined,
          ),
        );

        const { diagnostics } = await linter.lintText(
          example.source,
          "contract.sol",
        );

        if (example.correct) {
          expect(diagnostics).toEqual([]);
        } else {
          expect(diagnostics).not.toEqual([]);
        }
      });
    }
  }
});

function extractExamples(content: string): Example[] {
  const EXAMPLES_REGEX =
    /Examples of \*\*(correct|incorrect)\*\* code[\s\S]*?```solidity([\s\S]*?)```/g;
  const CONFIG_REGEX = /^\s*\/\/\s*config:\s*(.+)\n?/;

  const examples: Example[] = [];

  let match;
  while ((match = EXAMPLES_REGEX.exec(content)) !== null) {
    const source = match[2].trim();
    const configMatch = CONFIG_REGEX.exec(source);

    let config: any;
    if (configMatch) {
      config = eval(configMatch[1]);
    }

    examples.push({
      source,
      correct: match[1] === "correct",
      config,
    });
  }

  return examples;
}
