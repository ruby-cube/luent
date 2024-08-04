import { useReactivity } from "@rue/muonic"

const { $, set, o$, mu, o$$$ } = useReactivity();

// Tests:
// - simple signal
// - derived signal
// - derived signal in template
// - derived signal with memo

export function TestCounterSignals() {
    const $count = $(0)
    const $doubleCount = $(() => $count() * 2)

    function increment() {
        set($count, count => count + 1)
    }

    function decrement() {
        set($count, count => count - 1)
    }

    return (
        <>
            <div>{$count}</div>
            <div>{$doubleCount}</div>
            <div>{$(() => `The count is: ${$count()}. Doubled: ${$doubleCount()}`)}</div>
            <button onclick={increment}>increment</button>
            <button onclick={decrement}>decrement</button>
        </>
    )
}


export function TestCounter() {

    const { counter$, decrement, increment } = useCounter()

    return (
        <>
            <div>{$(() => counter$.count)}</div>
            <button onclick={increment}>increment</button>
            <button onclick={decrement}>decrement</button>
        </>
    )
}

function useCounter() {
    const counter$ = o$({
        count: 0
    })

    return {
        counter$,
        increment() {
            mu(counter$, o => {
                o.count = o.count + 1;
            })
        },
        decrement() {
            mu(counter$, o => {
                o.count = o.count - 1
            })
        }
    }
}