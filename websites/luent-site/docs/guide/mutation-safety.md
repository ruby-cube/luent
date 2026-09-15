# Mutation Safety
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>



By default, element and component bindings in the receiving scope are deeply read-only, enforced through compile-time mutation safety checks†. This keeps mutation local to the state owner and prevents accidental non-local mutations which can cause unpredictable behavior that is difficult to debug.

There is, however, good reason to mutate non-locally, given that direct mutation is the most ergonomic and performant way to synchronize state across component or element boundaries. For this, Luent provides explicit mutable bindings that are statically traceable so that non-local mutations may be performed in a safer manner.

:::warning † NOT YET AVAILABLE
Mutation safety checking is currently under development and not yet ready to use. This documentation serves as a preview of the feature and as a guide to using mutability annotations, which may be beneficial even without enforcement.
:::

## Local mutation

Local mutation is encouraged as it preserves pure local reasoning of state changes. If a child component needs to mutate state received from a parent or ancestor, it may mutate state indirectly through callbacks:
```tsx
// child
function IncrementButton(setup: FromTag<{
  count: Ion<number>;
  increment: () => void; // callback
}>) {
  const { $count, increment } = setup;

  return <>
    <button on:click={increment}>{$count}</button>
  </>
}
```
```tsx
// parent
function Counter() {
  const $count = ion(0, {
    increment() { this.value++ }
  })

  return <>
    <IncrementButton 
      count={$count}
      increment={() => $count.increment()}
    />
  </>
}
```

...or through event bindings:
```tsx
// child
function IncrementButton(setup: FromTag<{
  count: Ion<number>;
  onClick: (e: MouseEvent) => void; // event
}>) {
  const { $count, onClick } = setup;

  return <>
    <button on:click={onClick}>{$count}</button>
  </>
}
```

```tsx
// parent
function Counter() {
  const $count = ion(0, {
    increment() { this.value++ }
  })

  return <>
    <IncrementButton 
      count={$count}
      onClick={() => $count.increment()} 
    />
  </>
}
```

This keeps mutations visible to the component who owns the state—`Counter` in the example above.


## Non-local mutation

Indirect mutation can sometimes become unwieldy, especially when requests for mutations are deeply nested and iterative. When the complexity of indirect mutation outweighs the benefit of pure local reasoning, non-local mutation may be preferable.

Mutability annotations at binding sites tell the compiler to allow non-local mutation while making it explicit to the owner scope. This way, mutations are statically traceable and state changes can still be reasoned about.

### Mutability annotations
<!-- - `mu:` indicates that deep property assignments and method calls may be performed through the binding
- `m:` indicates that deep method calls (but no property assignments) may be performed through the binding
- no annotation indicates that no property assignments or method calls are performed through the binding -->
- **`mu:`**: deep property assignments and method calls allowed
- **`m:`**: deep method calls (but no property assignments) allowed
- **no annotation**: no property assignments or method calls allowed

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

This forms a two-way binding where the input element is permitted to mutate the ion for concise synchronization of DOM state and component state:

```tsx
<input mu:value={$newTodo} />
```

Compare with the more verbose one-way binding implementation:

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

Components define mutable bindings through the type annotation of its setup parameter.


**Method-call enabled binding**
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

**Mutable binding**
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
<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## More on mutability annotations

### Capability, not guarantee
Note that in the providing scope, mutability annotations indicate the *possibility* of mutation, not guaranteed mutation. 

### All methods are suspect
The mutation safety compiler does not distinguish between accessor methods and mutator methods. All nested non-local methods are considered potential mutators and must be annotated with `m:` or `mu:` in order to be called.

```tsx
function CountDisplay(setup: FromTag<{
  'm:count': Ion<number> & { isNegative(): boolean }
}>) {
  const { count@ } = setup;

  <:>
    {count@}
    {If((count@.isNegative())@, 
      <p class='msg'>Stop being so negative!</p>
    )}
  </:>
}
```

```tsx
function Counter(setup: FromTag<{
  'm:count': Ion<number> & { increment(): void }
}>) {
  const { count@ } = setup;

  <:>
    {count@}
    <button on:click={e => count@.increment()}>+</button>
  </:>
}
```

### Constrained permissions
In the receiving scope, mutability annotations tell the mutation safety compiler to allow mutations and method calls for the annotated binding. They do not override TypeScript `readonly` modifiers or runtime mutation blockers, such as `Object.freeze()`.

In this example, the TypeScript compiler prevents the mutation of count despite the mutability annotation.
```tsx
function Counter(setup: FromTag<{
  'mu:count': Ion<number> & { readonly value: number }
}>) {
  const { mu: { count@ } } = setup;

  function increment() {
    count++ // ❌ Cannot assign to 'value' because it is a read-only property.
  }
  
  <:>
    {/* ... */}
  </:>
}
```

In this example, a runtime error will be thrown because `count` has been frozen.
```tsx
<Counter mu:count={Object.freeze(count@)}
```
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




### Deep mutability
<!-- - nested properties
- nested through function calls
- mutable callback bindings -->

Mutability annotations enable nested property assignments and method calls. Mutability is propagated across reassignments and destructuring in addition to normal property access.

```tsx
function NameEditor(setup: FromTag<{
  'mu:user': { name: { first: string, last: string } }
}>) {
  const { mu: { user } } = setup;

  return <>
    <form on:submit={e => {
      e.preventDefault();
      user.name.first = e.target[0].value;
      user.name.last = e.target[1].value;
    }}>
      <label>first:</label>
      <input type='text' value={user.name.first}></input>
      <label>last:</label>
      <input type='text' value={user.name.last}></input>
      <button type="submit" hidden />
    </form>
  </>
}
```

### Local permissions

Mutation capabilities enabled by mutability annotations are confined to local boundaries. In order to propagate mutation capabilities to a nested scope, mutability must be marked again at the nested boundary.

```tsx
function Foo(setup: FromTag<{ 
  'mu:bar': Bar
}>) {
  const { mu: { bar } } = setup

  <:>
    <Bar mu:bar={bar}>
    {/* ... */}
  </:>
}

```

<!-- Conversely, if a nested component requires a mutability annotation on a non-local object, t -->

This creates a trail of mutability annotation breadcrumbs from the state-owner scope down to the mutating scope.






