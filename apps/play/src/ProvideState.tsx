//@ts-nocheck
import { $Node } from "@rue/lumo"
import { $, Ion } from "@rue/muonic"

class Counter {
    $: { count: number }

    constructor() {
        this.$ = ionize({ count: 0 })
    }

    increment() {
        this.$.count++
    }

    decrement() {
        this.$.count--
    }
}


function ParentBlock() {

    const counter = provide(COUNTER, new Counter());

    const $doubleCount = $(() => counter.$.count * 2)


    return {
        render:
            <>
                <h1>Hey</h1>
                <div>{$doubleCount}</div>
                <ChildBlock />
                <SiblingBlock />
                <button onclick={() => counter.increment()}>increment</button>
                <button onclick={() => decrement.decrement()}>decrement</button>
            </>
    }
}


function ChildBlock() {
    const counter = fromContext(COUNTER)

    return (
        <p>
            {$(() => counter.$.count)}
            <button onclick={() => counter.increment()}>increment</button>
            <button onclick={() => counter.decrement()}>decrement</button>
        </p>
    )
}


function SiblingBlock({ $count }: {
    $count?: AtomicIon<number>
}) {

    return (
        <p>
            {$(() => counter.$.count)}
        </p>
    )
}


