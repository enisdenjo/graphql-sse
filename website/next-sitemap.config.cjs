/**
 * @type {import('next-sitemap').IConfig}
 */
const opts = {
  siteUrl: process.env.SITE_URL || 'https://the-guild.dev/graphql/sse',
  generateIndexSitemap: false,
};
module.exports = opts;
