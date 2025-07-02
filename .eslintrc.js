module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    commonjs: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script' // Node-RED functions are scripts, not modules
  },
  globals: {
    // Node-RED specific globals
    msg: 'writable',
    node: 'readonly',
    context: 'readonly',
    flow: 'readonly',
    global: 'readonly',
    RED: 'readonly',
    env: 'readonly'
  },
  rules: {
    // Relax some rules for Node-RED context
    'no-unused-vars': ['warn', { 
      vars: 'local',
      args: 'none',
      ignoreRestSiblings: true,
      varsIgnorePattern: '^(msg|node|context|flow|global|RED|env)$'
    }],
    'no-undef': 'error',
    'no-console': 'off', // Console is commonly used in Node-RED
    'no-debugger': 'warn',
    'no-unreachable': 'warn',
    'no-duplicate-keys': 'error',
    'no-empty': 'warn',
    'no-extra-semi': 'warn',
    'no-func-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'warn',
    'no-obj-calls': 'error',
    'no-regex-spaces': 'warn',
    'no-sparse-arrays': 'warn',
    'no-unexpected-multiline': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
    'curly': ['warn', 'multi-line'],
    'eqeqeq': ['warn', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-multi-spaces': 'warn',
    'no-new-wrappers': 'warn',
    'no-throw-literal': 'warn',
    'no-with': 'error',
    'radix': 'warn',
    'vars-on-top': 'warn',
    'wrap-iife': ['warn', 'any'],
    'no-delete-var': 'error',
    'no-label-var': 'error',
    'no-shadow-restricted-names': 'error',
    'no-undef-init': 'warn',
    'no-use-before-define': ['warn', { functions: false }],
    'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
    'comma-spacing': ['warn', { before: false, after: true }],
    'comma-style': ['warn', 'last'],
    'computed-property-spacing': ['warn', 'never'],
    'eol-last': 'warn',
    'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
    'new-cap': ['warn', { newIsCap: true, capIsNew: false }],
    'no-array-constructor': 'warn',
    'no-mixed-spaces-and-tabs': 'warn',
    'no-multiple-empty-lines': ['warn', { max: 2 }],
    'no-new-object': 'warn',
    'no-spaced-func': 'warn',
    'no-trailing-spaces': 'warn',
    'no-extra-parens': ['warn', 'functions'],
    'no-underscore-dangle': 'off',
    'one-var': ['warn', 'never'],
    'padded-blocks': ['warn', 'never'],
    'semi': ['warn', 'always'],
    'semi-spacing': ['warn', { before: false, after: true }],
    'space-before-blocks': ['warn', 'always'],
    'space-before-function-paren': ['warn', { anonymous: 'always', named: 'never' }],
    'space-in-parens': ['warn', 'never'],
    'space-infix-ops': 'warn',
    'space-unary-ops': ['warn', { words: true, nonwords: false }],
    'spaced-comment': ['warn', 'always']
  }
}; 