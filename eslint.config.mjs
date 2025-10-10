// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "@next/eslint-plugin-next";

export default [
  // 🔹 Use recommended ESLint + Next.js + TypeScript settings
  js.configs.recommended,
  ...tseslint.configs.recommended,
  next.configs.recommended,

  // 🔹 Ignore folders we don't want to lint
  {
    ignores: ["**/node_modules/**", ".next", "dist"],
  },

  // 🔹 Custom overrides to make Vercel builds happy
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
