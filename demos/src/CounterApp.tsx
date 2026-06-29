import { component, ion } from "@rue/luent";

export function Counter(setup: {
  max: number
}) {
  const { max } = setup;

  const $disabled = ion(false);
  const $count = ion(Math.floor(Math.random() * max))

  const toggle = () => {
    $disabled.value = !$disabled()
  }

  const increment = () => {
    if ($count() === max) return;
    $count.value++
  }

  const resetCount = () => {
    $count.value = 0;
  }

  return (

    <div>
      <button on:click={toggle}>on | off</button>
      <button on:click={increment} disabled={$disabled}>
        {$count}
      </button>
      <button on:click={resetCount}>reset</button>
      <p>initial count: {$count()}</p>
    </div>
  )
}