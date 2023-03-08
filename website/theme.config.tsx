import { defineConfig, useTheme } from '@theguild/components';

const siteName = 'GraphQL SSE';

export default defineConfig({
  docsRepositoryBase: 'https://github.com/enisdenjo/graphql-sse',
  logo: (
    <div>
      <h1 className="md:text-md text-sm font-medium">{siteName}</h1>
      <h2 className="hidden text-xs sm:block">
        Reference implementation of the GraphQL over SSE spec
      </h2>
    </div>
  ),
  main({ children }) {
    useTheme();
    return <>{children}</>;
  },
  siteName,
});
