
# Reactive Structures

Often it makes more sense to model state through a data structure rather than a bunch of independent primitives. Reactive structures may be handled immutably with ions, mutably through ionic structures, or both immutably and mutably through ionized structures.

## Immutable structures

```nsx
function MovableBox() {
  get box = ion({ x: 0, y: 0 })

  function moveRight() {
    box = { 
      ...box, 
      x: box.x + 10 
    }
  }
  <:>
    <div class='box' 
      style={css`transform: ${(`translate(${box.x}px, ${box.y}px)`)@}`}
    ></div>
    <button on:click={moveRight}>▶</button>
  </:>
}
```
```tsx
function MovableBox() {
  const $box = ion({ x: 0, y: 0 })

  function moveRight() {
    $box.value = { 
      ...$box(), 
      x: $box().x + 10 
    }
  }
  return <>
    <div class='box' 
      style={css`transform: ${() => `translate(${$box().x}px, ${$box().y}px)`}`}
    ></div>
    <button on:click={moveRight}>▶</button>
  </>
}
```
:::danger Mutating will not trigger reactions!
```nsx
function moveRight() {
   box.x += 10 // ❌ This will not trigger updates:
}
```
```tsx
function moveRight() {
   $box().x += 10 // ❌ This will not trigger updates:
}
```
:::
:::details CODE SWITCH
**React:** `useState()`, `useReducer()`

**Vue:** `shallowRef()`

**Svelte:** `$state`

**Solid:** `createSignal()`

**Angular:** `signal()`
:::

<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

## Mutable structures
### Ionic objects

```nsx
function MovableBox() {
  const box = ionic({ x: 0, y: 0 })

  function moveRight() {
    box.x += 10
  }
  <:>
    <div class='box' 
      style={{ transform: (`translate(${box.x}px, ${box.y}px)`)@ }}
    ></div>
    <button on:click={moveRight}>▶</button>
  </:>
}
```
```tsx
function MovableBox() {
  const box = ionic({ x: 0, y: 0 })

  function moveRight() {
    box.x += 10
  }
  return <>
    <div class='box' 
      style={{ transform: () => `translate(${box.x}px, ${box.y}px)` }}
    ></div>
    <button on:click={moveRight}>▶</button>
  </>
}
```

```nsx
const box = ionic({ x: 0, y: 0 })

function moveRight() {
  box.x += 10
}
```
```tsx
const box = ionic({ x: 0, y: 0 })

function moveRight() {
  box.x += 10
}
```

:::details CODE SWITCH
**React:** `useSyncExternalStore()`

**Vue:** `reactive()`

**Svelte:** `$state`

**Solid:** `createMutable()`

:::


<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

### Ionic collections
`ionic` 
```nsx
const list = ionic(['🍎', '🍊', '🍐'])

list.push('🍌')
list.splice(1, 1)
```
```tsx
const list = ionic(['🍎', '🍊', '🍐'])

list.push('🍌')
list.splice(1, 1)
```
:::details CODE SWITCH

**Vue:** `reactive([])`

**Svelte:** `$state([])`

**Solid:** `createStore([])`, `createMutable([])`

:::
<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

### Ionic class instances
Class instances may also be made reactive using `ionic()`. To learn more, see [Classes and Reactivity](/guide/reusable-logic#classes-and-reactivity)

<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

<!-- ### Ion access
Property ions may be accessed using the `$of()` helper.
```tsx

``` -->

### Observing ions

Observe the ions of an ionic object by accessing the ion's state—either through property access or function call—within a tracked compound ion.

**Observed by a view:**
```nsx
<label on:dblclick={() => editTodo(todo)}>{(todo.title)@}</label>
```
```tsx
<label on:dblclick={() => editTodo(todo)}>{() => todo.title}</label>
```

**with `observe()`:**
```nsx
observe((todo.title)@, () => {
  console.log('title:': todo.title)
})
```
```tsx
observe(() => todo.title, () => {
  console.log('title:': todo.title)
})
```

**with the observer parameter of schedulers**
```nsx
awaitsTick(oo => {
  console.log(oo(todo.title@))
})
```
```tsx
awaitsTick(oo => oo(() => {
  console.log(todo.title)
}))
```

Alternatively, a persistent copy of the ion may be accessed using the `$of()` helper (rather than creating a new inline derivation each time). In NextScript, simply use the accessor operator `@`.
```nsx
<label on:dblclick={() => editTodo(todo)}>{todo.title@}</label>
```
```tsx
<label on:dblclick={() => editTodo(todo)}>{$of(todo).$title}</label>
```

This is useful when a mutable ion is needed for a mutable binding
```nsx
<input
  type="text"
  mu:value={todo.title@}
  at:attach={(node){ node.focus() }}
  on:blur={(){ doneEdit(todo) }}
  on:keyup={(e){ e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo) }}
/>
```
```tsx
<input
  type="text"
  mu:value={$of(todo).title}
  at:attach={node => node.focus()}
  on:blur={() => doneEdit(todo)}
  on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
/>
```
:::details CODE SWITCH
**React:** `useEffect()`

**Vue:** `observe()`, `watchEffect()`

**Svelte:** `$effect`

**Solid:** `createEffect()`

**Angular:** `effect()`
:::

### Nested Reactivity
`ionic()` ionizes properties shallowly, meaning nested structures will not be made ionic. Nested reactivity must be explicitly initialized using nested `ionic()` or passing in a nested reactivity initializer through the property's '-as' flag.

**Nested `ionic()`**
```nsx
const user = ionic({
  name: 'John Doe',
  address: ionic({
    number: 111,
    street: 'Some Place',
    city: 'Some City',
    state: 'Some State'
  })
})
```
```tsx
const user = ionic({
  name: 'John Doe',
  address: ionic({
    number: 111,
    street: 'Some Place',
    city: 'Some City',
    state: 'Some State'
  })
})
```

**Nested reactivity hooks**
```nsx
const user = ionic(getUser(id), { address: { '-as': ionic } })
```
```tsx
const user = ionic(getUser(id), { address: { '-as': ionic } })
```
```nsx
const todos = ionic(getTodos(), { '@each': { '-as': ionic } })
```
```tsx
const todos = ionic(getTodos(), { '@each': { '-as': ionic } })
```

#### Manual nested reactivity
Unlike other proxy-based reactivity systems, ionic objects with nested reactivity **do not** automatically make new property values or collection items reactive. This prevents identity surprises like:

```nsx
// with auto-conversion to reactive proxy

const profile = user.profile = new Profile()
profile === user.profile // false ⁉️ 
```
```tsx
// with auto-conversion to reactive proxy

const profile = user.profile = new Profile()
profile === user.profile // false ⁉️ 
```

Instead, Luent enforces consistency through types and manual ionization. The TypeScript compiler will call out nested reactivity discrepancies.

```nsx
// with type-enforced nested reactivity

// ❌ Type 'Profile' is not assignable to type 'Ionize<Profile>'.
const profile = user.profile = new Profile()
profile === user.profile // false
```
```tsx
// with type-enforced nested reactivity

// ❌ Type 'Profile' is not assignable to type 'Ionize<Profile>'.
const profile = user.profile = new Profile()
profile === user.profile // false
```
```nsx
// with type-enforced manual nested reactivity

const profile = user.profile = ionic(new Profile()) // ✅
profile === user.profile // true 😎
```
```tsx
// with type-enforced manual nested reactivity

const profile = user.profile = ionic(new Profile()) // ✅
profile === user.profile // true 😎
```


### Ion hooks
Hook into an ion's setter and getter with ion hooks.
```nsx
const user = ionic(getUser(id), { 
  address: { 
    '-as': ionic,
    '@get'() { 
      console.log('getting address') 
    },
    '@set'(value) { 
      console.log('setting address', value) 
    }
  } 
})
```
```tsx
const user = ionic(getUser(id), { 
  address: { 
    '-as': ionic,
    '@get'() { 
      console.log('getting address') 
    },
    '@set'(value) { 
      console.log('setting address', value) 
    }
  } 
})
```



<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>


## Hybrid structures
A reactive structure may be updated both immutably and mutably by wrapping an ionic structure in an ion. These are referred to as ionized structures and created using `ionize()`. 

Essentially, `ionize(x)` is shorthand for `ion(ionic(x))`, while the type `Ionized<T>` is shorthand for `Ion<Ionic<T>>`

```nsx
get todos = ionize([] as Todo[], {
  addTodo(todo: Todo) {
    this.push(todo)
  }
})

function removeCompleted() {
  todos = todos.filter(todo => !todo.completed)
}
```
```tsx
const todos = ionize([] as Todo[], {
  addTodo(todo: Todo) {
    this.push(todo)
  }
})

function removeCompleted() {
  todos = todos.filter(todo => !todo.completed)
}
```
:::details CODE SWITCH

**Vue:** `ref()`

**Svelte:** `$state`

:::

<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

