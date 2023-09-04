import { indexToAlgolia } from '@theguild/algolia';

const source = 'SSE';

const domain = process.env.SITE_URL;
if (!domain) {
  throw new Error('Missing domain');
}

indexToAlgolia({
  nextra: {
    source,
    domain,
    docsBaseDir: 'src/pages/',
  },
  source,
  domain,
  lockfilePath: 'algolia-lockfile.json',
  dryMode: process.env.ALGOLIA_DRY_RUN === 'true',
});
