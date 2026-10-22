import { createYoga } from "graphql-yoga";
import { schema } from "./schema.ts";

const yoga = createYoga({ schema, graphqlEndpoint: "/graphql" });

const server = Bun.serve({
  port: Number(process.env.PORT ?? 4000),
  fetch: yoga,
});

console.log(`GraphQL server ready at ${server.url}graphql`);
