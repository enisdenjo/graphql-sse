import { defineConfig, useTheme } from '@theguild/components';

export default defineConfig({
  siteName: 'SSE',
  docsRepositoryBase: 'https://github.com/enisdenjo/graphql-sse',
  main({ children }) {
    useTheme();
    return <>{children}</>;
  },
});
