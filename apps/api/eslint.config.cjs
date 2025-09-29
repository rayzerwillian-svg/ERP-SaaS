const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  {
    ignores: ["dist/**"],
  },
  ...compat.config({
    extends: [
      "plugin:@typescript-eslint/recommended",
      "prettier",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    env: {
      node: true,
      jest: true,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
];
