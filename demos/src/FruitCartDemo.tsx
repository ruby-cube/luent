import { component, For } from "@rue/luent"
import { ion, ionic } from "@rue/quarky"

export function FruitCartDemo() {
  const $count = ion(0)
  const $qty = ion(1)
  const $total = ion(() => $count() * $qty())
  const fruits = ionic(['🍎', '🍊', '🍐'])
  const $selectedFruit = ion(fruits[0] ?? '')

  function incrementCount() {
    $count.value++
  }

  function decrementCount() {
    if ($count() === 0) return
    $count.value--
  }

  function incrementQty() {
    $qty.value++
  }

  function decrementQty() {
    if ($qty() === 1) return
    $qty.value--
  }

  function rotateFruits() {
    const first = fruits.shift()
    if (first !== undefined) {
      fruits.push(first)
    }
    $selectedFruit.value = fruits[0] ?? ''
  }

  return component(
    <div>
      <h2>Fruit Cart</h2>
      <p>One derived total plus one reactive fruit list.</p>

      <p>Selected fruit: {$selectedFruit}</p>

      <div>
        {For(fruits, fruit =>
          <button on:click={() => $selectedFruit.value = fruit}>
            {fruit}
          </button>
        )}
      </div>

      <p>
        <button on:click={decrementCount}>-</button>
        {' '}bundles: {$count}{' '}
        <button on:click={incrementCount}>+</button>
      </p>

      <p>
        <button on:click={decrementQty}>-</button>
        {' '}fruit per bundle: {$qty}{' '}
        <button on:click={incrementQty}>+</button>
      </p>

      <p>Total fruit: {$total}</p>

      <button on:click={rotateFruits}>Rotate fruit list</button>

      <ul>
        {For(fruits, fruit =>
          <li>{fruit}</li>
        )}
      </ul>
    </div>
  )
}