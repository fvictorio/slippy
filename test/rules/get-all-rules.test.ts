import fs from "node:fs/promises";
import { expect, it } from "vitest";
import { getAllRules } from "../../src/rules/get-all-rules.js";

it("getAllRules should return all rules in the directory", async () => {
  const allRules = getAllRules();

  const rulesDirectory = new URL("../../src/rules", import.meta.url);

  let numberOfRuleFiles = 0;
  for (const file of await fs.readdir(rulesDirectory)) {
    if (
      file.endsWith(".ts") &&
      file !== "get-all-rules.ts" &&
      file !== "types.ts"
    ) {
      numberOfRuleFiles++;
    }
  }

  expect(allRules).toHaveLength(numberOfRuleFiles);
});
