import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // The standard "set loading, fetch, set result" pattern used throughout
      // features/ is flagged by this new (eslint-plugin-react-hooks v7) rule.
      // It's a well-established, correct pattern for effect-driven data
      // fetching, not a bug — disabled deliberately rather than restructuring
      // working fetch logic around an experimental lint rule.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  eslintConfigPrettier,
);
