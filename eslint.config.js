import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["src/**/*.{ts,js,mjs,cjs}"],
    ignores: ["dist/", "node_modules/", "coverage/", "build/"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: pluginJs.configs.recommended.languageOptions?.parser,
    },
    rules: {
      // "no-console": "warn",
      // "no-debugger": "warn",
      "no-duplicate-imports": "error",
      "prefer-const": "error",
      eqeqeq: "error",
      "no-var": "error",
      curly: "error",
      "no-multiple-empty-lines": ["error", { max: 4 }],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      indent: ["error", 2],
      "comma-dangle": ["error", "always-multiline"],
      "object-curly-spacing": ["error", "always"],
      "no-trailing-spaces": "error",
      // "no-useless-return": "error",
      "no-dupe-else-if": "error",
      "no-case-declarations": "error",
      "no-constant-condition": "error",
      "no-empty": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    rules: {
      ...prettierConfig.rules,
    },
  },
];
