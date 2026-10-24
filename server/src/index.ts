import { createYoga, isAsyncIterable, type Plugin } from "graphql-yoga";
import { schema, type Context } from "./schema.ts";

// Copy the cache info a resolver left on the context into the response `extensions`.
const cacheInfoPlugin: Plugin<Context> = {
  onExecute: () => ({
    onExecuteDone: ({ args, result, setResult }) => {
      const cache = (args.contextValue as Context).cache;
      if (!cache || isAsyncIterable(result)) return;
      setResult({ ...result, extensions: { ...result.extensions, cache } });
    },
  }),
};

const yoga = createYoga({ schema, graphqlEndpoint: "/graphql", plugins: [cacheInfoPlugin] });

const server = Bun.serve({
  port: Number(process.env.PORT ?? 4000),
  fetch: yoga,
});

console.log(`GraphQL server ready at ${server.url}graphql`);
