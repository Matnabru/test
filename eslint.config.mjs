import globals from "globals";
import pluginJs from "@eslint/js";
import tsEslint from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginNode from "eslint-plugin-node";
import eslintPluginPromise from "eslint-plugin-promise";

export default [
  {
    languageOptions: {
      parser: tsEslintParser,
      globals: {
        ...globals.node,
        ...globals.builtin,
      },
    },
    files: ["**/*.ts", "**/*.tsx", "**/*.js"],
    rules: {
      ...tsEslint.configs.recommended.rules,
      "no-console": "warn",
      "no-useless-catch": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ...pluginJs.configs.recommended,
  },
  {
    rules: {
      ...tsEslint.configs.recommended.rules,
      "no-console": "warn",
      "no-useless-catch": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    plugins: {
      "@typescript-eslint": tsEslint,
      import: eslintPluginImport,
      node: eslintPluginNode,
      promise: eslintPluginPromise,
    },
  },
  { ignores: ["dist/**/*"] },
];
