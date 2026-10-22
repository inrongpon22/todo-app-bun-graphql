import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import * as db from "./db.ts";

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

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      todos: () => db.listTodos(),
    },
    Mutation: {
      addTodo: (_: unknown, { title }: { title: string }) => db.addTodo(cleanTitle(title)),
      toggleTodo: (_: unknown, { id }: { id: string }) => db.toggleTodo(Number(id)),
      updateTodo: (_: unknown, { id, title }: { id: string; title: string }) =>
        db.updateTodo(Number(id), cleanTitle(title)),
      deleteTodo: (_: unknown, { id }: { id: string }) => db.deleteTodo(Number(id)),
    },
  },
});
