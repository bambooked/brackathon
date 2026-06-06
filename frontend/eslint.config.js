import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import vitest from '@vitest/eslint-plugin'
import testingLibrary from 'eslint-plugin-testing-library'

// NOTE: 以下は ESLint v10 flat config と非互換のため除外（各プラグイン側の対応待ち）
//   - eslint-plugin-react       → context.getFilename() 廃止への未対応
//   - eslint-plugin-tailwindcss → context.getSourceCode() 廃止への未対応

export default [
  // ---- ソースファイル共通 ----
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // --- TypeScript ---
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // --- React Hooks ---
      ...reactHooks.configs.recommended.rules,

      // --- Fast Refresh ---
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- アクセシビリティ ---
      ...jsxA11y.flatConfigs.recommended.rules,

      // --- import 順序 ---
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // --- 一般 ---
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ---- テストファイル ----
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: {
      'vitest': vitest,
      'testing-library': testingLibrary,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...testingLibrary.configs['flat/react'].rules,
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ---- 除外 ----
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
  },
]
