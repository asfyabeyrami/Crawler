export const parser = '@typescript-eslint/parser';
export const parserOptions = {
    project: 'tsconfig.json',
    sourceType: 'module',
};
export const plugins = ['@typescript-eslint/eslint-plugin'];

export const root = true;
export const env = {
    node: true,
    jest: true,
};
export const ignorePatterns = ['.eslintrc.js'];
export const rules = {
    'linebreak-style': 0,
    'strict': 0,
    'max-len': ['error', { code: 120 }],
    'quote-props': 'off',
    'no-param-reassign': 'off',
    'no-underscore-dangle': 'off',
    'func-names': ['error', 'as-needed'],
    'prefer-const': 'warn',
    'radix': 'off',
    'no-restricted-syntax': ['error', "BinaryExpression[operator='at']"],
    'no-await-in-loop': 'off',
    'no-trailing-spaces': 'off',
    'object-curly-spacing': 'off',
    'object-curly-newline': ['error', {
        'ObjectExpression': { 'multiline': true, 'minProperties': 6, 'consistent': true },
        'ObjectPattern': { 'multiline': true, 'minProperties': 6, 'consistent': true },
        'ImportDeclaration': { 'multiline': true, 'minProperties': 6, 'consistent': true },
        'ExportDeclaration': { 'multiline': true, 'minProperties': 6, 'consistent': true },
    }],
    'global-require': 'off',
    'import/no-dynamic-require': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': [
        'error',
        {
            'endOfLine': 'auto',
        }
    ]
};
