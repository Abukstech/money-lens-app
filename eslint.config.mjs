import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".expo/**",
      "coverage/**",
      "ios/**",
      "android/**",
    ],
  },
  { files: ["*.cjs"], languageOptions: { globals: { module: "readonly" } } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/screens/Onboarding.tsx"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
);
