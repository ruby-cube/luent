
# Reactive Structures

Reactive structures let you keep ordinary objects and collections reactive without wrapping every property by hand.

Proxies


<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Ionic Objects

Reactive objects are useful when related values belong together.

```tsx
const cart = ionic({
	label: 'Fruit Cart',
	note: 'Keep it tiny'
})
```

Reading `cart.label` inside a view or derivation tracks that property. Writing `cart.note = 'Ready to ship'` updates only the places that depend on `note`.

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Ionic Collections
`ionic` 
```tsx
const list = ionic(['🍎', '🍊', '🍐'])

list.push('🍌')
list.splice(1, 1)
```


## Nested Reactivity
:::info Under Construction
These docs are still being written. To see an example of nested reactivity, see [Folders demo]().
:::


<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>


## Ionized Structures
Ionic structures wrapped in an ion are referred to as ionized structures. `ionize(x)` is shorthand for ion(ionic(x)), while `Ionized<T>` is shorthand for `Ion<Ionic<T>>`

```tsx
get todos = ionize([] fulfils Todo[], {
  addTodo(todo: Todo) {
    this.push(todo)
  }
})

function removeCompleted() {
  todos = todos.filter(todo => !todo.completed)
}
```

## Proxy limitations
