```tsx


function Todos(setup: { limit: number }) {
  const { limit } = setup

  const todos = ionic([
    new Todo('learn Luent')
  ])

  const draft = ion('', {
    set(text: string) { draft.value = text },
    clear() { draft.value = '' }
  })

  const actions = ion(null, {
    addTodo() {
      const title = draft.value.trim()
      if (!title || todos.length >= limit) return
      todos.push({ title, done: false })
      draft.clear()
    },
    toggle(todo: { done: boolean }) {
      todo.done = !todo.done
    }
  })

  const remaining = ion(() => limit - todos.length)
  const completed = ion(() => todos.filter(todo => todo.done).length)

  return component(
    <>
      <input
        value={draft}
        placeholder='What needs to be done?'
        onInput={event => draft.set(event.currentTarget.value)}
      />
      <button onClick={() => actions.addTodo()}>Add</button>

      <ul>
        {For(todos, todo =>
          <li>
            <label>
              <input
                type='checkbox'
                checked={todo.done}
                onChange={() => actions.toggle(todo)}
              />
              {todo.title}
            </label>
          </li>
        )}
      </ul>

      {If(remaining,
        <p>{remaining} slots left</p>
      )}
      {If(ion(() => remaining.value === 0),
        <p>Todo limit reached</p>
      )}

      <p>{completed} completed</p>
    </>
  )
}



```


```tsx


function Todos(setup: { goal: number }) {
  const { goal } = setup

  const todos = ionic([
    new Todo('learn Luent')
  ])

  const count = ion(0, {
    increment(n: number) { count.value += n },
    decrement(n: number) { count.value -= n }
  })

  const remaining = ion(() => goal - todos.length)

  return component(
    <div>
      <ul>
        {For(todos, todo =>
          <TodoItem todo={todo}/>
        )}
      </ul>

      {If(remaining,
        <p>{remaining} slots left</p>
      )}
    </div>
  )
}



```