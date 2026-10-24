import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import * as db from "./db.ts";
import { getCachedTodos, invalidateTodos, setCachedTodos } from "./cache.ts";

const typeDefs = /* GraphQL */ `
  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
    createdAt: String!
  }

  type Query {
    todos: [Todo!]!
  }

  type Mutation {
    addTodo(title: String!): Todo!
    toggleTodo(id: ID!): Todo
    updateTodo(id: ID!, title: String!): Todo
    deleteTodo(id: ID!): Boolean!
  }
`;

const cleanTitle = (title: string) => {
  const trimmed = title.trim();
  if (!trimmed) throw new GraphQLError("Title cannot be empty");
  return trimmed;
};

// Where the `todos` query got its data, reported back in the response `extensions`.
export type CacheInfo = { source: "redis" | "sqlite"; ms: number };
export type Context = { cache?: CacheInfo };

// Run a write against SQLite, then drop the cached todo list.
const withInvalidate = async <T>(write: () => T): Promise<T> => {
  const result = write();
  await invalidateTodos();
  return result;
};

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      todos: async (_: unknown, __: unknown, ctx: Context) => {
        const start = performance.now();
        const report = (source: CacheInfo["source"]) => {
          ctx.cache = { source, ms: Number((performance.now() - start).toFixed(2)) };
          console.log(`todos ← ${source} (${ctx.cache.ms}ms)`);
        };

        const cached = await getCachedTodos();
        if (cached) {
          report("redis");
          return cached;
        }
        const todos = db.listTodos();
        report("sqlite");
        await setCachedTodos(todos);
        return todos;
      },
    },
    Mutation: {
      addTodo: (_: unknown, { title }: { title: string }) =>
        withInvalidate(() => db.addTodo(cleanTitle(title))),
      toggleTodo: (_: unknown, { id }: { id: string }) =>
        withInvalidate(() => db.toggleTodo(Number(id))),
      updateTodo: (_: unknown, { id, title }: { id: string; title: string }) =>
        withInvalidate(() => db.updateTodo(Number(id), cleanTitle(title))),
      deleteTodo: (_: unknown, { id }: { id: string }) =>
        withInvalidate(() => db.deleteTodo(Number(id))),
    },
  },
});
