# Mutable Bindings

By default, element and component bindings are read-only, enforced by Luent's compile-time mutation checking.

However, direct mutation is often the simplest and most ergonomic way to synchronize state across component or element boundaries. For this, Luent provides explicit mutable bindings that are statically traceable.

Mutable bindings are marked with the `mu:` prefix.

```tsx
<input mu:value={$newTodo}/>
```
```tsx
<Todos mu:todos={$todos} />
```

## Mutable element bindings
Input elements such as `<input>` and `<select>` expose mutable bindings on attributes that may reflect user input. 

This forms a two-way binding where the input element is permitted to mutate the ion:
```tsx
// newTodo will be mutated
<input mu:value={$newTodo}/>
```

Compare the one-way binding implementation:
```tsx
<input
   value={$newTodo}
   on:input={e => $newTodo.value = e.target.value}
/>
```

:::details CODE SWITCH
Vue: `v-model`

Svelte: `bind:`

Angular: `[(attribute)]`
:::

## Mutable component bindings
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>

Components may also define mutable bindings

The `mu` linter is an experimental linter that only permits component input mutation when explicitly declared by both the component and its consumer.

In `Counter`, `count` may only be mutated if accessed as a property or nested property of the `mu` object.

```tsx
function App() {
  get count = ion(0, {
    increment() { count++ },
    decrement() { count-- },
  })
  
  <:>
    <Counter mu:count={count@} />
  </:>
}
```

```tsx
function Counter(setup: {
  'mu:count': Ion<number> & {
    increment: () => void; 
  };
}) {
  const { mu, count@ } = fromTag(setup);

  <:>
    {count@}
    <button on:click={e=> mu(count@).value++}>+</button>
  </:>
}
```

### Deep mutation


### Read vs Write Methods
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>

The `mu` linter assumes methods passed to a component is a mutating method, or a write method, unless it is explicitly typed with a final `ƒ: read` parameter.

The linter will disallow `count.isNegative()` here:
```tsx
function NegativeNotification(setup: {
  count: Ion<number> & {
    isNegative: () => boolean; // assumed to be mutating
  };
}) {
  const { $count } = fromTag(setup)
  
  <:>
    <div>{count.isNegative() ? '😕' : '🙂'}</div>
  <:>
}
```

`count.isNegative()` is OK here:
```tsx
function NegativeNotification(setup: {
  count: Ion<number> & {
    isNegative: () => boolean; // assumed to be mutating
  };
}) {
  const { $count } = fromTag(setup)
  
  <:>
    <div>{count.isNegative() ? '😕' : '🙂'}</div>
  <:>
}
```

Luent infers read methods when the method body is locally verifiable. If a method calls unknown code, performs assignment, or passes mutable state into another function, it is treated as a write method unless marked with a `ƒ: read` parameter.

A read method may access reactive state and participate in dependency tracking, but it may not mutate application state.

```tsx


```