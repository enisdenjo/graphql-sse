/**
 * @type {Partial<import('typedoc').TypeDocOptions> & Partial<import('typedoc-plugin-markdown').MarkdownTheme>}
 */
const opts = {
  entryPointStrategy: 'expand',
  // The API reference is committed and served by the-guild-org/website (see
  // website/README.md); .github/workflows/docs-regenerate.yaml keeps it current.
  out: './website/content/docs',
  // "Defined in" links point at master rather than the commit typedoc ran on,
  // so regenerating without source changes yields no diff.
  gitRevision: 'master',
  readme: 'none',
  plugin: ['typedoc-plugin-markdown'],
  excludeExternals: true,
  excludePrivate: true,
  categorizeByGroup: false, // removes redundant category names in matching modules
  githubPages: false,
  exclude: ['**/index.ts', '**/utils.ts', '**/parser.ts', '**/tests/**/*'],
  entryDocument: 'index.md',
  hideInPageTOC: true,
  publicPath: '/docs/',
  hideBreadcrumbs: true,
};
module.exports = opts;
