import { Database } from "bun:sqlite";

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

type TodoRow = Omit<Todo, "completed"> & { completed: number };

const db = new Database(new URL("../todos.sqlite", import.meta.url).pathname, { create: true });

db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const toTodo = (row: TodoRow | null): Todo | null =>
  row ? { ...row, completed: row.completed === 1 } : null;

const listStmt = db.query<TodoRow, []>("SELECT * FROM todos ORDER BY id");
const getStmt = db.query<TodoRow, [number]>("SELECT * FROM todos WHERE id = ?");
const insertStmt = db.query<TodoRow, [string]>("INSERT INTO todos (title) VALUES (?) RETURNING *");
const toggleStmt = db.query<TodoRow, [number]>(
  "UPDATE todos SET completed = 1 - completed WHERE id = ? RETURNING *",
);
const updateStmt = db.query<TodoRow, [string, number]>(
  "UPDATE todos SET title = ? WHERE id = ? RETURNING *",
);
const deleteStmt = db.query<TodoRow, [number]>("DELETE FROM todos WHERE id = ? RETURNING *");

export const listTodos = (): Todo[] => listStmt.all().map((row) => toTodo(row)!);
export const getTodo = (id: number) => toTodo(getStmt.get(id));
export const addTodo = (title: string) => toTodo(insertStmt.get(title))!;
export const toggleTodo = (id: number) => toTodo(toggleStmt.get(id));
export const updateTodo = (id: number, title: string) => toTodo(updateStmt.get(title, id));
export const deleteTodo = (id: number) => deleteStmt.get(id) !== null;
