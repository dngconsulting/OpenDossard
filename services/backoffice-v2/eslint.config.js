import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'

export default defineConfig([
  // Global ignores
  globalIgnores(['dist', 'node_modules', '.pnpm-store']),

  // Main configuration for TypeScript and React files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: '19.1.1',
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // ==========================================
      // TypeScript Rules
      // ==========================================

      // Enforce consistent naming conventions
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
      ],

      // Prefer @ts-expect-error over @ts-ignore
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 3,
        },
      ],

      // Warn on explicit any, but don't block development
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow empty interfaces (useful for extending types)
      '@typescript-eslint/no-empty-object-type': 'off',

      // Unused vars - allow vars starting with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // ==========================================
      // React Rules
      // ==========================================

      // React 19 uses automatic JSX runtime
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // TypeScript handles prop types
      'react/prop-types': 'off',

      // Enforce consistent JSX formatting
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/self-closing-comp': 'warn',

      // React Refresh - warn instead of error for shadcn pattern
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['loader', 'action'] },
      ],

      // ==========================================
      // Accessibility Rules (jsx-a11y)
      // ==========================================

      // Basic accessibility rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',

      // Interactive elements
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',

      // Labels and form controls
      'jsx-a11y/label-has-associated-control': [
        'warn',
        {
          assert: 'either',
        },
      ],

      // ==========================================
      // Import Rules
      // ==========================================

      // Enforce import order
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',        // Node.js built-in modules
            'external',       // External packages
            'internal',       // Absolute imports (@/)
            'parent',         // Parent imports (../)
            'sibling',        // Sibling imports (./)
            'index',          // Index imports
            'type',           // Type imports
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
        },
      ],

      // No duplicate imports
      'import/no-duplicates': 'error',

      // Ensure imports point to files that exist
      'import/no-unresolved': 'off', // TypeScript handles this better

      // Prefer default export for React components
      'import/prefer-default-export': 'off',

      // ==========================================
      // General JavaScript/TypeScript Rules
      // ==========================================

      // Enforce consistent brace style
      'curly': ['warn', 'all'],

      // Enforce === and !==
      'eqeqeq': ['error', 'always', { null: 'ignore' }],

      // No console.log in production
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Prefer const over let
      'prefer-const': 'warn',

      // No unused expressions
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],

      // Enforce return types on functions (off for now, can be enabled later)
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Specific configuration for mock files
  {
    files: ['**/*.mocks.ts', '**/*.mock.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Specific configuration for test files (when you add them)
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
])
