import { defineConfig, useTheme } from '@theguild/components';
import Image from 'next/image';

const siteName = 'GraphQL SSE';

export default defineConfig({
  docsRepositoryBase: 'https://github.com/enisdenjo/graphql-sse',
  logo: (
    <div className="flex items-center gap-2">
      <div>
        <Image
          priority
          src="/logo.svg"
          width={36}
          height={36}
          alt="GraphQL SSE"
        />
      </div>
      <div>
        <h1 className="md:text-md text-sm font-medium">{siteName}</h1>
        <h2 className="hidden text-xs sm:block">
          Reference implementation of the GraphQL over SSE spec
        </h2>
      </div>
    </div>
  ),
  main({ children }) {
    useTheme();
    return <>{children}</>;
  },
  siteName,
});
