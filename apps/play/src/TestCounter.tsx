

// Tests:
// - simple signal
// - derived signal
// - derived signal in template
// - derived signal with memo

import { $, ionize, ion } from "../../../packages/quarky/src"

export function TestCounterSignals() {
    const $count = ion(0)
    const $doubleCount = $(() => $count() * 2)

    function increment() {
        $count.update(count => count + 1)
    }

    function decrement() {
        $count.update(count => count - 1)
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
    const counter$ = ionize({
        count: 0
    })

    return {
        counter$,
        increment() {
            counter$.count = counter$.count + 1;
        },
        decrement() {
            counter$.count = counter$.count - 1
        }
    }
}