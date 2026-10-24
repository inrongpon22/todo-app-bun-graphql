# Todo GraphQL

A simple full-stack todo app built with **Bun**, **Vite**, **React**, **TypeScript**, and **GraphQL**.

- **Server:** [graphql-yoga](https://the-guild.dev/graphql/yoga-server) running on `Bun.serve`, storing data in SQLite via `bun:sqlite`
- **Cache:** Redis (via Bun's built-in client) in front of SQLite, run locally with Docker Compose
- **Client:** React + Vite, talking to the API with plain `fetch` (no GraphQL client library)

## Features

- Add, complete, rename (double-click), and delete todos
- Filter by All / Active / Completed
- Todos persist across server restarts (SQLite file)

## Requirements

- [Bun](https://bun.sh) 1.x
- [Docker](https://www.docker.com) (optional, for Redis)

```sh
curl -fsSL https://bun.sh/install | bash
```

## Getting started

```sh
bun install
bun run redis:up   # start Redis in Docker (optional)
bun run dev
```

- App: http://localhost:5173
- GraphQL API + GraphiQL: http://localhost:4000/graphql

The Vite dev server proxies `/graphql` to the API server, so no CORS setup is needed.

## Scripts

Run from the repo root:

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `bun run dev`        | Start both the server and the client   |
| `bun run dev:server` | Start the GraphQL server only (`:4000`) |
| `bun run dev:client` | Start the Vite dev server only (`:5173`) |
| `bun run redis:up`   | Start Redis with Docker Compose (`:6379`) |
| `bun run redis:down` | Stop the Redis container                |

Inside `client/`:

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `bun run build` | Type-check and build to `client/dist` |
| `bun run preview` | Preview the production build        |

## Project structure

```
.
├── package.json        # Bun workspaces: server, client
├── docker-compose.yml  # Redis for local development
├── server/
│   └── src/
│       ├── index.ts    # Yoga + Bun.serve entry point
│       ├── schema.ts   # GraphQL type definitions and resolvers
│       ├── db.ts       # SQLite setup and data access
│       └── cache.ts    # Redis cache for the todo list
└── client/
    ├── vite.config.ts  # /graphql proxy to the server
    └── src/
        ├── api.ts      # fetch-based GraphQL helper and typed operations
        └── App.tsx     # Todo UI
```

## GraphQL schema

```graphql
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
```

Example request:

```sh
curl http://localhost:4000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"mutation { addTodo(title: \"Buy milk\") { id title completed } }"}'
```

## Configuration

Set these in the environment or in a `server/.env` file (see `server/.env.example`):

| Variable    | Default                  | Description                       |
| ----------- | ------------------------ | --------------------------------- |
| `PORT`      | `4000`                   | GraphQL server port               |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL              |
| `CACHE_TTL` | `60`                     | Cache lifetime in seconds         |

Data is stored in `server/todos.sqlite` (git-ignored). Delete it to reset all todos.

## Caching

SQLite is the source of truth; Redis is a cache-aside layer:

- The `todos` query reads the `todos:all` key from Redis. On a miss it loads from SQLite and stores the result with a TTL of `CACHE_TTL` seconds.
- Every mutation writes to SQLite, then deletes `todos:all`, so the next read is fresh.
- If Redis is down, the app keeps working directly against SQLite and logs a single warning. It reconnects automatically when Redis comes back.

Inspect the cache with:

```sh
docker compose exec redis redis-cli GET todos:all
```

## Notes

The client scripts run Vite with `bun --bun vite`, so Vite uses Bun's runtime instead of Node. This avoids native-binary mismatches, for example when Node is an x64 build on an Apple Silicon Mac.
