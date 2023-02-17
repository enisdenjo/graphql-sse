import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import gzip from 'rollup-plugin-gzip';

export default {
  input: './src/client.ts',
  plugins: [typescript()],
  output: [
    {
      file: './umd/graphql-sse.js',
      format: 'umd',
      name: 'graphqlSse',
    },
    {
      file: './umd/graphql-sse.min.js',
      format: 'umd',
      name: 'graphqlSse',
      plugins: [terser()],
    },
    {
      file: './umd/graphql-sse.min.js', // gzip plugin will add the .gz extension
      format: 'umd',
      name: 'graphqlSse',
      plugins: [terser(), gzip()],
    },
  ],
};
