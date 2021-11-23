module.exports = {
  extends: [
    'eslint:recommended',
    'react-app',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'next',
    'next/core-web-vitals',
  ],
  // eslint-plugin-react-app adds their rules to overrides, so in order to
  // override them, we need to use overrides as well
  overrides: [
    {
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:typescript-sort-keys/recommended',
      ],
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.*.json'],
      },
      plugins: ['typescript-sort-keys'],
      rules: {
        '@typescript-eslint/array-type': [
          'warn',
          { default: 'generic', readonly: 'generic' },
        ],
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/naming-convention': [
          'error',
          {
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
            selector: 'default',
            trailingUnderscore: 'allow',
          },
          {
            format: ['strictCamelCase', 'StrictPascalCase', 'UPPER_CASE'],

            leadingUnderscore: 'allow',
            // strictCamelCase is preferred but allow StrictPascalCase for React
            // components and other new-able classLikes, and UPPER_CASE for
            // constants
            selector: 'variable',
            trailingUnderscore: 'allow',
          },
          {
            format: ['strictCamelCase', 'StrictPascalCase'],

            leadingUnderscore: 'allow',
            // strictCamelCase is preferred but allow StrictPascalCase for React
            // components and other new-able classLikes
            selector: 'function',
            trailingUnderscore: 'allow',
          },
          {
            format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
            leadingUnderscore: 'allow',
            selector: 'property',
            trailingUnderscore: 'allow',
          },
          {
            format: ['StrictPascalCase'],
            selector: 'typeLike',
          },
          {
            format: ['PascalCase'],

            prefix: ['T'],
            // "typeParameter" is another word for "generic"
            selector: 'typeParameter',
          },
          {
            format: ['PascalCase'],
            prefix: ['I'],
            selector: 'interface',
          },
        ],
        '@typescript-eslint/no-duplicate-imports': ['error'],
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
        'no-duplicate-imports': 'off',
        'no-shadow': 'off',
      },
    },
  ],

  plugins: ['sort-destructure-keys', 'sort-keys-fix'],
  rules: {
    '@next/next/no-img-element': 'off',
    'default-case': 'warn',
    eqeqeq: ['error', 'always'],
    'linebreak-style': ['error', 'unix'],
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-duplicate-imports': 'warn',
    'no-lonely-if': 'error',
    'no-shadow': 'error',
    // 'no-unexpected-multiline': 'off',
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
};
