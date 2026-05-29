import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config({
  extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  ignores: ["dist/", "node_modules/", "eslint.config.ts"],
});
