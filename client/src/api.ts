export type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}

const TODO_FIELDS = 'id title completed createdAt'

export const fetchTodos = () =>
  gql<{ todos: Todo[] }>(`query { todos { ${TODO_FIELDS} } }`).then((d) => d.todos)

export const addTodo = (title: string) =>
  gql<{ addTodo: Todo }>(
    `mutation ($title: String!) { addTodo(title: $title) { ${TODO_FIELDS} } }`,
    { title },
  ).then((d) => d.addTodo)

export const toggleTodo = (id: string) =>
  gql<{ toggleTodo: Todo | null }>(
    `mutation ($id: ID!) { toggleTodo(id: $id) { ${TODO_FIELDS} } }`,
    { id },
  ).then((d) => d.toggleTodo)

export const updateTodo = (id: string, title: string) =>
  gql<{ updateTodo: Todo | null }>(
    `mutation ($id: ID!, $title: String!) { updateTodo(id: $id, title: $title) { ${TODO_FIELDS} } }`,
    { id, title },
  ).then((d) => d.updateTodo)

export const deleteTodo = (id: string) =>
  gql<{ deleteTodo: boolean }>(`mutation ($id: ID!) { deleteTodo(id: $id) }`, { id }).then(
    (d) => d.deleteTodo,
  )
