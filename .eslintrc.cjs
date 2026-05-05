module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.angular/',
    '.turbo/',
    'apps/*/src/generated/',
    'tools/docker/data/',
    'pnpm-lock.yaml',
  ],
  overrides: [
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      env: {
        es2022: true,
        node: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
      rules: {
        'import/no-commonjs': 'off',
      },
    },
    {
      files: ['*.ts'],
      env: {
        browser: true,
        es2022: true,
        node: true,
      },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      plugins: ['@angular-eslint', '@typescript-eslint', 'import'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',
      ],
      settings: {
        'import/resolver': {
          typescript: {
            project: ['tsconfig.base.json', 'apps/*/tsconfig*.json', 'packages/*/tsconfig*.json'],
          },
        },
      },
      rules: {
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'sxg',
            style: 'kebab-case',
          },
        ],
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'sxg',
            style: 'camelCase',
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            fixStyle: 'inline-type-imports',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        'import/no-duplicates': 'error',
      },
    },
    {
      files: ['*.html'],
      extends: [
        'plugin:@angular-eslint/template/recommended',
        'plugin:@angular-eslint/template/accessibility',
      ],
      parser: '@angular-eslint/template-parser',
      rules: {},
    },
  ],
};
