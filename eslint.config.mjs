import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules", "dist"],
  },
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_" },
      ],
      "no-console": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      semi: ["warn", "always"],
    },
  },
];
