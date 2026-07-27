// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    ignores: [
      'dist/',
      'node_modules/',
      'realworld/',
      'coverage/',
      '.angular/',
      'e2e/',
      'playwright-report/',
      'test-results/',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['app', 'if'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // Components use constructor injection throughout; migrating every one to inject()
      // is a sweeping refactor that is out of scope for enabling linting.
      '@angular-eslint/prefer-inject': 'off',
      // Existing public component outputs are named `click`/`toggle`; renaming them
      // would be a breaking API change for consumers of these components.
      '@angular-eslint/no-output-native': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      // Specs stub HTTP payloads and rxjs errors with `any` on purpose.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // Accessibility gaps in the existing templates are tracked separately; surface
      // them as warnings instead of blocking the lint gate on a template rewrite.
      '@angular-eslint/template/alt-text': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
    },
  },
]);
