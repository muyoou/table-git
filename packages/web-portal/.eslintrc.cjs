/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals", "plugin:@tanstack/eslint-plugin-query/recommended"],
  parserOptions: {
    ecmaVersion: 2022
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off"
  }
};
