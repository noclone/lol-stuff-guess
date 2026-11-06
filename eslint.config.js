import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default tseslint.config(...pluginVue.configs["flat/recommended"], {
  files: ["**/*.vue"],
  languageOptions: {
    parserOptions: {
      parser: tseslint.parser,
      extraFileExtensions: [".vue"],
      sourceType: "module",
    },
  },
});
