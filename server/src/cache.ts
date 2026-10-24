import { RedisClient } from "bun";
import type { Todo } from "./db.ts";

const TODOS_KEY = "todos:all";
const TTL_SECONDS = Number(process.env.CACHE_TTL ?? 60);

// Reconnect lazily on each request instead of queueing, so a missing Redis
// fails fast and the app falls back to SQLite.
const redis = new RedisClient(process.env.REDIS_URL ?? "redis://localhost:6379", {
  autoReconnect: false,
  enableOfflineQueue: false,
  connectionTimeout: 1000,
});

let healthy = true;

async function tryRedis<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    if (!redis.connected) await redis.connect();
    const result = await fn();
    if (!healthy) {
      healthy = true;
      console.log("Redis reconnected, caching resumed");
    }
    return result;
  } catch (err) {
    if (healthy) {
      healthy = false;
      console.warn(`Redis unavailable, falling back to SQLite: ${(err as Error).message}`);
    }
    return null;
  }
}

export async function getCachedTodos(): Promise<Todo[] | null> {
  const json = await tryRedis(() => redis.get(TODOS_KEY));
  return json ? (JSON.parse(json) as Todo[]) : null;
}

export async function setCachedTodos(todos: Todo[]): Promise<void> {
  await tryRedis(() => redis.set(TODOS_KEY, JSON.stringify(todos), "EX", TTL_SECONDS));
}

export async function invalidateTodos(): Promise<void> {
  await tryRedis(() => redis.del(TODOS_KEY));
}
