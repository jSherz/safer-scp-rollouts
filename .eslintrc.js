module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js", "*.d.ts"],
  overrides: [
    {
      files: ["*.ts"],
      excludedFiles: "*.d.ts",
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "tsconfig.json",
        sourceType: "module",
      },
      plugins: ["@typescript-eslint/eslint-plugin", "eslint-comments"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
      ],
      rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "eslint-comments/require-description": ["error", { ignore: [] }],
      },
    },
  ],
};
