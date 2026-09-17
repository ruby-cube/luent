
# Reactive Structures

Often it makes more sense to model state through a data structure rather than a bunch of independent primitives. Reactive structures may be handled immutably with ions, mutably through ionic structures, or both immutably and mutably through ionized structures.

## Immutable structures

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
```tsx
function moveRight() {
   $box().x += 10 // ❌ This will not trigger updates:
}
```
:::

<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

## Mutable structures
### Ionic objects

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

```jsx
const box = ionic({ x: 0, y: 0 })

function moveRight() {
   box.x += 10
}
```


<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

### Ionic collections
`ionic` 
```tsx
const list = ionic(['🍎', '🍊', '🍐'])

list.push('🍌')
list.splice(1, 1)
```
<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

### Ionic class instances
Class instances may also be made reactive using `ionic()`. To learn more, see [Classes and Reactivity](/guide/reusable-logic#classes-and-reactivity)

### Tracking ions
### Triggering ions

### Nested Reactivity
`ionic()` ionizes properties shallowly, meaning nested structures will not be made ionic.
:::info Under Construction
These docs are still being written. To see an example of nested reactivity, see [Folders demo]().
:::


<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>


## Hybrid structures
A reactive structure may be updated both immutably and mutably by wrapping an ionic structure in an ion. These are referred to as ionized structures and created using `ionize()`. 

Essentially, `ionize(x)` is shorthand for `ion(ionic(x))`, while the type `Ionized<T>` is shorthand for `Ion<Ionic<T>>`

```tsx
get todos = ionize([] as Todo[], {
  addTodo(todo: Todo) {
    this.push(todo)
  }
})

function removeCompleted() {
  todos = todos.filter(todo => !todo.completed)
}
```

<p align="right"><a href="#reactive-structures" style="text-decoration: none">[top]</a></p>

