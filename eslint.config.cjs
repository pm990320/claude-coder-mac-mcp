const ignores = require('./eslint.ignores.cjs');
const gts = require('gts');

// Find the config with the @typescript-eslint plugin
const tsEslintConfig = gts.find(
  c => c.plugins && c.plugins['@typescript-eslint']
);

module.exports = [
  {ignores},
  ...gts,
  {
    files: ['**/*.ts'],
    plugins: tsEslintConfig.plugins,
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
];
