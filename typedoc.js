/**
 * @type {Partial<import('typedoc').TypeDocOptions>}
 */
const opts = {
  out: './docs',
  readme: 'none',
  plugin: ['typedoc-plugin-markdown'],
  excludeExternals: true,
  excludePrivate: true,
  disableSources: true,
  categorizeByGroup: false, // removes redundant category names in matching modules
  githubPages: false,
  exclude: ['**/index.ts', '**/utils.ts', '**/parser.ts', '**/__tests__/**/*'],
};
module.exports = opts;
