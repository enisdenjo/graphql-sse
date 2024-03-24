import { defineConfig, PRODUCTS } from '@theguild/components';

export default defineConfig({
  description: PRODUCTS.SSE.title,
  docsRepositoryBase: 'https://github.com/enisdenjo/graphql-sse',
  logo: PRODUCTS.SSE.logo({ className: 'w-9' }),
  websiteName: 'SSE',
});
