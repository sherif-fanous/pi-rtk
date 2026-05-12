import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import perfectionist from "eslint-plugin-perfectionist";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@stylistic": stylistic,
      perfectionist,
      unicorn,
    },
    rules: {
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "id-length": ["error", { min: 2, exceptions: ["i", "j", "_"] }],
      "no-console": "error",
      "no-control-regex": "off",
      "perfectionist/sort-modules": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          groups: [
            "export-interface",
            "export-type",
            "interface",
            "type",
            "export-enum",
            "enum",
            "export-class",
            "class",
            "export-function",
            "function",
          ],
        },
      ],
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "@stylistic/no-multiple-empty-lines": [
        "error",
        { max: 1, maxBOF: 0, maxEOF: 0 },
      ],
      "@stylistic/padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: ["return", "break", "continue", "throw"],
        },
        { blankLine: "always", prev: "*", next: ["const", "let", "var"] },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        {
          blankLine: "always",
          prev: "multiline-expression",
          next: "multiline-expression",
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        // Module-level const literals are SCREAMING_SNAKE_CASE
        // (e.g. SUBCOMMANDS, THINKING_LEVELS). camelCase is also allowed
        // because module-level const *functions* and arrow consts (rare)
        // should still be camelCase.
        {
          selector: "variable",
          modifiers: ["const", "global"],
          format: ["UPPER_CASE", "camelCase", "PascalCase"],
        },
        // Local variables: camelCase only.
        {
          selector: "variable",
          modifiers: ["const"],
          format: ["camelCase"],
          // Local-only — global handled above.
          filter: { regex: "^[A-Z_]+$", match: false },
        },
        // Functions / methods / parameters: camelCase.
        { selector: "function", format: ["camelCase"] },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // Types / interfaces: PascalCase.
        { selector: "typeLike", format: ["PascalCase"] },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      parserOptions: {
        program: null,
        project: false,
        projectService: false,
      },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
    },
  },
);
