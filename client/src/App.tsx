import { useEffect, useState, type FormEvent } from 'react'
import * as api from './api.ts'
import type { Todo } from './api.ts'
import './App.css'

type Filter = 'all' | 'active' | 'completed'

const FILTERS: Filter[] = ['all', 'active', 'completed']

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    try {
      setError(null)
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    run(async () => setTodos(await api.fetchTodos()))
  }, [])

  const replace = (todo: Todo | null) => {
    if (todo) setTodos((ts) => ts.map((t) => (t.id === todo.id ? todo : t)))
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    run(async () => {
      const todo = await api.addTodo(title)
      setTodos((ts) => [...ts, todo])
      setTitle('')
    })
  }

  const handleToggle = (id: string) => run(async () => replace(await api.toggleTodo(id)))

  const handleDelete = (id: string) =>
    run(async () => {
      if (await api.deleteTodo(id)) setTodos((ts) => ts.filter((t) => t.id !== id))
    })

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  const commitEdit = () => {
    const id = editingId
    if (!id) return
    setEditingId(null)
    const original = todos.find((t) => t.id === id)
    if (!editTitle.trim() || editTitle.trim() === original?.title) return
    run(async () => replace(await api.updateTodo(id, editTitle)))
  }

  const visible = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed,
  )
  const remaining = todos.filter((t) => !t.completed).length

  return (
    <main className="app">
      <h1>Todos</h1>

      <form className="add" onSubmit={handleAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
        <button type="submit" disabled={!title.trim()}>
          Add
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="list">
        {visible.map((todo) => (
          <li key={todo.id} className={todo.completed ? 'done' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
              aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`}
            />
            {editingId === todo.id ? (
              <input
                className="edit"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                autoFocus
              />
            ) : (
              <span className="title" onDoubleClick={() => startEdit(todo)} title="Double-click to edit">
                {todo.title}
              </span>
            )}
            <button className="delete" onClick={() => handleDelete(todo.id)} aria-label="Delete">
              ×
            </button>
          </li>
        ))}
        {visible.length === 0 && <li className="empty">Nothing here.</li>}
      </ul>

      <footer className="footer">
        <span>
          {remaining} item{remaining === 1 ? '' : 's'} left
        </span>
        <div className="filters">
          {FILTERS.map((f) => (
            <button key={f} className={f === filter ? 'active' : ''} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </footer>
    </main>
  )
}

export default App
