import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import sortKeysFix from 'eslint-plugin-sort-keys-fix';
import importPlugin from 'eslint-plugin-import';
// import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import { includeIgnoreFile } from '@eslint/compat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  resolvePluginsRelativeTo: __dirname,
});

const gitignorePath = path.resolve(__dirname, '.gitignore');

const eslintConfig = [
  includeIgnoreFile(gitignorePath),
  ...compat.extends('next', 'next/core-web-vitals', 'prettier'),
  // ...compat.plugins('@typescript-eslint'),
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    name: 'TypeScript and JavaScript files',
    plugins: {
      import: importPlugin,
      'sort-destructure-keys': sortDestructureKeys,
      'sort-keys-fix': sortKeysFix,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'default-case': 'warn',
      eqeqeq: ['error', 'always'],
      'import/no-duplicates': 'warn',

      'import/no-unused-modules': [
        'error',
        {
          ignoreExports: [
            '**/*.d.ts',
            '**/*.test.ts',
            'app/sitemap.ts',
            'app/manifest.ts',
            'app/**/{global-error,layout,not-found,page}.tsx',
            'instrumentation.ts',
            'packages/podcast-index/{constants,index}.ts',
            '{app,pages}/api/**/*.{ts,tsx}',
          ],
          unusedExports: true,
        },
      ],

      'linebreak-style': ['error', 'unix'],
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-lonely-if': 'error',
      'no-shadow': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'padded-blocks': ['warn', 'never'],

      'padding-line-between-statements': [
        'warn',
        {
          blankLine: 'always',
          next: 'return',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: 'block-like',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: '*',
          prev: 'block-like',
        },
        {
          blankLine: 'always',
          next: 'break',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: 'continue',
          prev: '*',
        },
        {
          blankLine: 'never',
          next: ['case', 'default'],
          prev: 'case',
        },
      ],

      'prefer-arrow-callback': [
        'warn',
        {
          allowNamedFunctions: true,
        },
      ],

      'prefer-const': 'warn',
      'prefer-object-spread': 'warn',
      'prefer-rest-params': 'warn',
      'react/jsx-handler-names': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'sort-destructure-keys/sort-destructure-keys': 'warn',
      'sort-keys-fix/sort-keys-fix': 'warn',
      yoda: 'error',
    },
    ignores: ['next-env.d.ts'],
  },
  {
    ...compat.extends('next/typescript')[0],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        project: [
          './tsconfig.json',
          './packages/podcast-index/tsconfig.ref.json',
        ],
        tsconfigRootDir: __dirname,
      },

      sourceType: 'module',
    },
    name: 'TypeScript files',
    plugins: {
      // 'typescript-sort-keys': typescriptSortKeys,
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/array-type': [
        'warn',
        {
          default: 'generic',
          readonly: 'generic',
        },
      ],

      '@typescript-eslint/explicit-member-accessibility': 'off',

      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allowSingleOrDouble',
          selector: 'default',
          trailingUnderscore: 'allow',
        },
        {
          format: ['strictCamelCase', 'StrictPascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allowSingleOrDouble',
          selector: 'variable',
          trailingUnderscore: 'allow',
        },
        {
          format: ['strictCamelCase', 'StrictPascalCase'],
          leadingUnderscore: 'allowSingleOrDouble',
          selector: 'function',
          trailingUnderscore: 'allow',
        },
        {
          format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allowSingleOrDouble',
          selector: 'property',
          trailingUnderscore: 'allow',
        },
        {
          format: null,
          modifiers: ['requiresQuotes'],
          selector: 'objectLiteralProperty',
        },
        {
          format: ['StrictPascalCase'],
          selector: 'typeLike',
        },
        {
          format: ['PascalCase'],
          prefix: ['T'],
          selector: 'typeParameter',
        },
      ],

      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'no-shadow': 'off',
    },
    ignores: ['next-env.d.ts'],
  },
];

export default eslintConfig;
