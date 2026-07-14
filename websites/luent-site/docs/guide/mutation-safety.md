# Mutation Safety
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>

By default, element and component bindings are read-only in receiving scopes, as hidden mutations of shared state can cause unpredictable behavior that may be difficult to debug. This is enforced through compile-time mutation safety checks, keeping mutations local to the state owner and preventing accidental mutations.

There is, however, good reason to mutate non-locally given that direct mutation is the simplest, most ergonomic and performant way to synchronize state across component or element boundaries. For this, Luent provides explicit mutable bindings that are statically traceable so that non-local mutations may be performed in a safer manner.


## Local mutation

Local mutation preserves pure local reasoning of state changes. //TODO:

If a child component needs to mutate state received from a parent or ancestor, it may mutate state indirectly through callbacks:
```tsx
// child
function IncrementButton(setup: FromTag<{
  count: Ion<number>;
  increment: () => void;
}>) {
  const { $count, increment } = setup;

  return <>
    <button on:click={increment}>{$count}</button>
  </>
}
```
```tsx
// parent
<IncrementButton 
  count={$count}
  increment={() => $count.increment()} 
/>
```

...or through event bindings:
```tsx
// child
function IncrementButton(setup: FromTag<{
  count: Ion<number>;
  onClick: (e: MouseEvent) => void;
}>) {
  const { $count, onClick } = setup;

  return <>
    <button on:click={onClick}>{$count}</button>
  </>
}
```

```tsx
// parent
<IncrementButton 
  count={$count}
  onClick={() => $count.increment()} 
/>
```

This keeps mutations visible to the component who owns the state.


## Non-local mutation

Indirect mutation can sometimes become unwieldy, especially when requests for mutations are deeply nested and iterative. When the complexity of indirect mutation outweighs the benefit of pure local reasoning, non-local mutation becomes the better choice.

The ability to reason about state changes can be preserved by making non-local mutation capability explicit to the owner scope through mutability annotations at binding site.

#### Mutability Annotations
<!-- - `mu:` indicates that deep property assignments and method calls may be performed through the binding
- `m:` indicates that deep method calls (but no property assignments) may be performed through the binding
- no annotation indicates that no property assignments or method calls are performed through the binding -->
- **`mu:`**: deep property assignments and method calls may be performed
- **`m:`**: deep method calls (but no property assignments) may be performed
- **no annotation**: no property assignments or method calls may be performed

Mutability annotations may be used on select element bindings:
```tsx
<input mu:value={$newTodo} />
```

...as well as component bindings, as defined by the component:
```tsx
<Todos mu:todos={$todos} />
```

<!-- Mutable bindings are marked in the providing scope with `mu:` or `m:` annotations. The `mu:` annotation allows receiving scopes to deeply mutate reference values of mutable bindings, either through property assignment or method calls. The `m:` annotation allows mutation through method calls only. -->
<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

### Element bindings

Input elements such as `<input>` and `<select>` expose mutable bindings on attributes that may reflect user input.

This forms a two-way binding where the input element is permitted to mutate the ion:

```tsx
<input mu:value={$newTodo} />
```

Compare with the one-way binding implementation:

```tsx
<input value={$newTodo} on:input={e => $newTodo.value = e.target.value} />
```

:::details CODE SWITCH
Vue: `v-model`

Svelte: `bind:`

Angular: `[(attribute)]`
:::
<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>


### Component bindings
<!-- 
Note that mutability annotations indicate the possibility of mutation, not guaranteed mutation.
 -->

Components define mutable bindings through the setup parameter type annotation.


Method-call enabled binding
```tsx
function Counter(setup: FromTag<{
  'm:count': Ion<number> & {
    increment: () => void;
  };
}>) {
  const { m: { count@ } } = setup;

  <:>
    {count@}
    <button on:click={e => count@.increment()}>+</button>
  </:>
}
```

Mutable binding
```tsx
function Counter(setup: FromTag<{
  'mu:count': MutableIon<number>
}>) {
  const { mu: { count@ } } = setup;

  <:>
    {count@}
    <button on:click={e => count++}>+</button>
  </:>
}
```

#### Deep
a trail of mutability annotation breadcrumbs



//-------------

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
function Counter(setup: FromTag<{
  'mu:count': Ion<number> & {
    increment: () => void;
  };
}>) {
  const { mu, count@ } = setup;

  <:>
    {count@}
    <button on:click={e=> mu(count@).value++}>+</button>
  </:>
}
```



<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>

The `mu` linter assumes methods passed to a component is a mutating method, or a write method, unless it is explicitly typed with a final `ƒ: read` parameter.

The linter will disallow `count.isNegative()` here:

```tsx
function NegativeNotification(setup: FromTag<{
  count: Ion<number> & {
    isNegative: () => boolean; // assumed to be mutating
  };
}>) {
  const { $count } = setup

  <:>
    <div>{count.isNegative() ? '😕' : '🙂'}</div>
  <:>
}
```

`count.isNegative()` is OK here:

```tsx
function NegativeNotification(setup: FromTag<{
  count: Ion<number> & {
    isNegative: () => boolean; // assumed to be mutating
  };
}>) {
  const { $count } = setup

  <:>
    <div>{count.isNegative() ? '😕' : '🙂'}</div>
  <:>
}
```

Luent infers read methods when the method body is locally verifiable. If a method calls unknown code, performs assignment, or passes mutable state into another function, it is treated as a write method unless marked with a `ƒ: read` parameter.

A read method may access reactive state and participate in dependency tracking, but it may not mutate application state.

```tsx

```

#### Mutable callback bindings
