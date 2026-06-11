
# Reactive Structures

Reactive structures let you keep ordinary objects and collections reactive without wrapping every property by hand. A tiny fruit cart is enough to show the pattern:

```tsx
get count = ion(0)
get qty = ion(1)
get total = ion((count * qty)@)
const list = ionic(['🍎', '🍊', '🍐'])
```

In this example, `count` and `qty` are atomic ions, `total` is a derived ion, and `list` is a reactive collection. The UI can read all four directly, and any write to `count`, `qty`, or `list` updates the parts of the view that depend on them.

## Ultra Simple Demo App

```tsx
function FruitCart() {
  const list = ionic(['🍎', '🍊', '🍐'])
	get count = ion(0)
	get qty = ion(1)
	get total = ion((count * qty)@)
	get selected = ion(list[0])

	<::>
		<h2>Fruit Cart</h2>
		<p>Selected fruit: {selected@}</p>

		{For(list, fruit =>
			<button on:click={() => selected@.value = fruit}>
				{fruit}
			</button>
		)}

		<p>
			<button on:click={() => count--} disabled={(count === 0)@}>-</button>
			bundles: {count@}
			<button on:click={() => count++}>+</button>
		</p>

		<p>
			<button on:click={() => qty--} disabled={(qty === 1)@}>-</button>
			fruit per bundle: {qty@}
			<button on:click={() => qty++}>+</button>
		</p>

		<p>Total fruit: {total@}</p>
	</::>
}
```

This is intentionally small, but it demonstrates three useful ideas at once:

- `count` and `qty` are local writable state.
- `total` is derived state, so no manual syncing is needed.
- `list` is a reactive array, so `shift()` and `push()` update the rendered list automatically.

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

Reactive arrays, sets, and maps are useful when the structure itself changes over time.

```tsx
const list = ionic(['🍎', '🍊', '🍐'])

list.push('🍌')
list.splice(1, 1)
```

Collection methods such as `push`, `splice`, `set`, and `delete` preserve reactivity, so `For(list, ...)` stays in sync with the current contents.


## Nested Reactivity

Nested values can stay reactive as long as they are also part of a reactive structure.

```tsx
const items = ionic([
	{ fruit: '🍎', qty: 1 },
	{ fruit: '🍊', qty: 2 }
])

items[0].qty++
```

That lets you scale the fruit cart example from a single `count * qty` total to a full list of line items without changing the mental model: read reactive values in derivations and views, then mutate the reactive structure directly.

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

