# Type syntax

::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable.
:::

## Reactive structures
<code><i>Type</i>*</code> <span class='doc-tag'>Experimental</span><span class='doc-tag'>Planned</span>

The `*` type postfix marks objects and collections as reactive. It is a shorthand for a parameterized type that represents a reactive structure. 

Frameworks may configure which parameterized type the postfix should represent. In the example below, Luent configures it to mean `Ionic<T>`:

```ts
// noriscript.config.ts

export default configureNextScript({
  ts: {
    reactiveProxy: ['Ionic'],
    importSource: ['luent']
  },
})
```

This enables the `*` type postfix to be used in NoriScript source code:
```ns
function getCompletedTodos (todos: Todo*[]*) {
  return todos.filter(todo => todo.completed)
}
```

:::info transpiled ts
```ts
const { Ionic } from 'luent'

function getCompletedTodos (todos: Ionic<Ionic<Todo>[]>) {
  return todos.filter(todo => todo.completed)
}
```
:::