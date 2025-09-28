import { fileURLToPath } from "node:url";
import eslint from "@eslint/js";
import tseslint, { ConfigArray } from "typescript-eslint";
import { includeIgnoreFile } from "@eslint/compat";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

const config: ConfigArray = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/strict-boolean-expressions": "error",
      "no-console": "error",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
);

export default config;
