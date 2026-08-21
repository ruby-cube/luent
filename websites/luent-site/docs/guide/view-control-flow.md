# View Control Flow
Luent offers three main ways of rendering views based on control flow:
- JSX flow expressions
- JavaScript control flow for static-only rendering
- the `display-if` attribute for conditional display

View control flow may render either static views or dynamic views. A view is dynamic when its presence in the DOM is determined by reactive state.


## View Control Flow Series
Luent provides the following series of primitive control flow functions for writing view control flow:

**Iterative rendering**
- `For`
- `Thru`

**Conditional rendering**
- `If/ElseIf/Else`
- `Match/Case/Default`
- `As`

Additionally, the following [specialized control flow series]() are provided for async and error rendering.
- `Await`/`Meanwhile`/`Twiddle`/`Catch`
- `Try`/`Catch`


## JSX Flow Expressions
Flow function calls, or JSX flow expressions, are only valid within JSX. The last parameter of a flow function, known as the view slot, takes in a render function. 

For convenience and readability, the slot argument may be written in shorthand as JSX. Luent's JSX transpiler normalizes the slot position of flow expressions into render functions.

For example:

**with render function**
```tsx
<div>
  {If(active, () =>
    <Foo/>
  )}
</div>
```
**with shorthand**
```tsx
<div>
  {If(active, 
    <Foo/>
  )}
</div>
```

### Optional parameters
Some control flow functions may take in optional arguments *before* the slot argument since the slot parameter is always the final parameter of a flow function.
```tsx
<div>
  {If(active, 'preserve',
    <Foo/>
  )}
</div>
```



## Iterative Rendering
Luent provides two functions for view iterations: `For()` and `Thru()`. `For()` renders iterables while `Thru()` renders number ranges.

### Static iteratives

There are two main ways of rendering static iterative views:

**with `For` and `Thru`**

When passed a non-reactive iterable, `For()` and `Thru()` render items statically, meaning the collection are rendered once and not updated when the collection changes.

```tsx
function FruitList() {
  const fruits = [🍑, 🍐, 🟣]

  return (
    <ul>
      {For(fruits, (fruit, index) =>
        <li>{index + 1}. {fruit}</li>
      )}
    </ul>
  )
}
```

**with JavaScript `Array.map()`**

Static lists may also be rendered through a JavaScript array's `map` method.
```tsx
<ul>
  {fruits.map((fruit, index) => {
    <li>{index + 1}. {fruit}</li>
  })}
</ul>
```

### Reactive `For()`
`For()` can also render collections reactively when passed either an ion or an ionic iterable.

### `For` unique items
To render collections based on item identity, pass a identity accessor function as the second argument of `For()`. The identity accessor receives the item as its argument and can either return the item itself (if items are unique objects or strings) or a unique ID. 

The third argument is a render function that receives an item and an index ion, meaning it will render a view where the item is stable and the index may change.

```tsx
<ul>
  {For(todos, u => u.id, (todo, $index) =>
    <li>
      {$index}. {todo.title}
    </li>
  )}
</ul>
```

Identity-based iteration allows Luent to preserve item identity as items are inserted, removed, or reordered. This is preferred when each row has local state or persistent DOM behavior.

```tsx
function TodoList() {
  const todos = ionic([
    { id: genID(), title: 'Write docs' },
    { id: genID(), title: 'Review examples' }
  ])

  const addItem = () => {
    todos.push({ id: genID(), title: '' })
  }

  const removeItem = (index: number) => {
    todos.splice(index, 1)
  }

  return (
    <ul>
      {For(todos, u => u.id, (todo, $index) =>
        <Todo 
          mu:text={$of(todo).title} 
          removeItem={() => removeItem($index())} 
        />
      )}
      <button on:click={addItem}>+</button>
    </ul>
  )
}
```

### `For` indices
To render a reactive collection based on stable indices and changing values, omit the identity accessor. The render function will receive an item ion and a stable index. This form is concise and works well for simple lists that don't require reordering.

```tsx

function Log() {
  const logs = ionic<string[]>([])
  
  function log(msg: string) {
    logs.push(msg)
  }

  return (
    <ul>
      {For(logs, ($msg, index) =>
        <li>{index}: {$msg}</li>
      )}
    </ul>
  )
}
```

### `Thru` count
Like, `For()` `Thru()` may be rendered reactively or statically based on the reactivity of its first argument.

When passed a number or number ion, `Thru()` renders a range from 1 up to a count.

```tsx
function RowBar(setup: FromTag<{
  rows: Ionic<Cell[]>
}>) {
  const { rows }

  return (
    <div>
      {Thru(() => rows.length, row =>
        <div>{row}</div>
      )}
    </div>
  )
}
```

### `Thru` range 
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>

When passed a range tuple or range ion, `Thru()` renders through the provided range. This is useful for rendering windows or slices of larger collections without creating derived arrays.

```tsx
function PaginatedTable(setup: FromTag<{
  rows: Ionic<Row[]>
}>) {
  const { rows } = setup

  const $page = ion(0)
  const pageSize = 20
  const $start = ion(() => $page() * pageSize)
  const $end = ion(() => Math.min($start() + pageSize, rows.length))

  return (
    <>
      <table>
        <tbody>
          {Thru(() => [$start(), $end()], (_, index) =>
            <TableRow row={rows[index]} />
          )}
        </tbody>
      </table>

      <button
        disabled={() => $page() === 0}
        on:click={() => $page.value--}
      >
        Previous
      </button>

      <button
        disabled={() => ($page() + 1) * pageSize >= rows.length}
        on:click={() => $page.value++}
      >
        Next
      </button>
    </>
  )
}
```



## Conditional Rendering
Luent provides three distinct control flow functions for static and reactive conditional rendering: 
- `If`/`Else` for ordered conditional branching
- `As` for rendering a view as the active case
- `Match`/`Case` for diverse case rendering

Luent also exposes a display-toggle attribute, `display-if` on elements to ergonomically show or hide an element. 

### Conditional display
`display-if` is a hybrid of static and dynamic rendering. It lazily mounts the element to the DOM if its initial state is false. Once mounted, the element remains in the DOM and Luent toggles its CSS display property based on the state of `display-if`.

```tsx
<div display-if={$active}>Hello world</div>
<button on:click={$active.toggle}>
  {() => $active() ? 'hide' : 'show'}
</button>
```

### Static-only conditionals
Static conditional rendering may be also achieved through JavaScript ternaries and if/else statements.

**with if/else statements**
```tsx
function Foo({ bar }) {

  if (bar) {
    return (
      <Bar/>
    )
  }
  return (
    <DefaultView/>
  )
}
```

**with ternaries**
```tsx
function Foo(setup: {
  bar: boolean
}) { 
  const { bar } = setup

  return ( 
    <section> 
      {bar ? <Bar/> : <DefaultView/>}
    </section> 
  )
}
```

### `If`/`Else`
The `If()`, `ElseIf()`, and `Else()` control flow functions render ordered conditional branching. `If`/`Else` series must start with an `If()` call. Additional branches (if any), must directly follow the opening `If()`.

```tsx
function StatusMessage() {
  const $status = ion('idle' as 'idle' | 'loading' | 'done')

  return (
    <div>
      {If(() => $status() === 'loading',
        <p>Loading...</p>
      )}
      {ElseIf(() => $status() === 'done',
        <p>Done.</p>
      )}
      {Else(
        <p>Ready.</p>
      )}
    </div>
  )
}
```

### `Match`/`Case`
`Match` matches an input, which may be reactive or static, against one or more `Case()` values. In contrast with `If`/`Else`, which checks branches in order, `Match()` performs keyed case selection.

```tsx
function TabContent() {
  const $tab = ion('home' as 'home' | 'settings' | 'about')

  return <>
    {Match($tab, <>
      {Case('home', 
        <Home/>
      )}
      {Case('about', 
        <About/>
      )}
      {Case('settings', 
        <Settings/>
      )}
      {Default(<p>Not found</p>)}
    </>)}
  </>
}
```

### `As(case)`
`As()`, like `Match()`, renders a view as the active case. Unlike `Match()`, which maps explicit cases to different views, `As()` applies the same render function to its current case. It is especially useful when there is an indefinite number of cases.

```tsx
<main>
  {As($tab, tab =>
    <div>
      <Tab page={pages[tab]} />
    </div>
  ))}
  {Default(
    <div>No tabs open</div>
  )}
</main>
```

#### Preserving views
Although each case uses the same render function, `As()` gives each case identity its own view. The views may be preserved by passing in the 'preserve' attach type. Changing case identities remounts the active view while caching inactive views for later reuse. 

```tsx
<main>
  {As($tab, 'preserve', tab =>
    <div>
      <Tab page={pages[tab]} />
    </div>
  ))}
  {Default(
    <div>No tabs open</div>
  )}
</main>
```
See: [Preserving Views](/guide/preserving-views)

#### Discarding preserved views
To discard preserved views, pass in a views object in place of 'preserve'. Luent will populate it with view objects containing a `markDiscard()` method.

```tsx
function closeTab(tab: number) {
  views[tab]?.markDiscard()
  openTabs.removeTab(tab)
}

<nav class="inline">
  {For(openTabs, u => u, tab => (
    <div 
      class={($tab() === tab && 'selected')} 
      on:click={e => { !e.from('span') && ($tab.value = tab) }}
    >
      {tabNames[tab]}
      <span on:click={() => closeTab(tab)}>x</span>
    </div>
  ))}
</nav>
<main>
  {As($tab, views, tab =>
    <div>
      <Tab page={pages[tab]} />
    </div>
  ))}
  {Default(
    <div>No tabs open</div>
  )}
</main>
```
