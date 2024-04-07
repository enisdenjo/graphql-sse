/**
 * @type {import('next-sitemap').IConfig}
 */
const opts = {
  outDir: 'out', // next has to be built first
  siteUrl: process.env.SITE_URL || 'https://the-guild.dev/graphql/sse',
  generateIndexSitemap: false,
  exclude: ['*/_meta'],
  output: 'export',
};
module.exports = opts;
