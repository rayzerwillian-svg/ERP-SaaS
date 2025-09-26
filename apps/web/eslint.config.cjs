const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
    ],
  },
  ...compat.config({
    extends: ["next", "turbo", "prettier"],
    rules: {
      "react/jsx-key": "off",
    },
  }),
];
