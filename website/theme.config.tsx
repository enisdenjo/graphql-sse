import { defineConfig, useTheme } from '@theguild/components';

const siteName = 'GraphQL SSE';

export default defineConfig({
  docsRepositoryBase: 'https://github.com/enisdenjo/graphql-sse',
  main({ children }) {
    useTheme();
    return <>{children}</>;
  },
  siteName,
});
