import { Component, fromContext, Provide, TypedKey } from "@rue/lumo"
import { $, ReactiveIon, DerivedIon, Ion, ionize } from "../../../packages/quarky/src"
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon"

const COUNTER = Symbol("Counter") as TypedKey<Counter>
const DOUBLE_COUNT = Symbol("DerivedIon<number>") as TypedKey<DerivedIon<number>>
const NAME = Symbol(`{
    $: string;
    makeKermit: () => void;
}`) as TypedKey<{
    $: string;
    makeKermit: () => void;
}>

// Cases
// - Read-only ion
// - Read-only writable derived ion
// - ion or derived ion that can only be set with provided methods
// - ionic model that only exposes some methods
// - readonly props ion when object is encapsulated

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


export function ParentBlock(
    setup: {},
    provide: Provide
) {

    const counter = provide(COUNTER, new Counter());
    const $doubleCount = provide(DOUBLE_COUNT, Ion(() => counter.$.count * 2));

    const $name = Ion("Sir Robin")

    function makeBrave() {
        $name.set('The brave')
    }

    function makeKermit() {
        console.log("make kermit")
        $name.set('Kermit')
    }

    const frog = ionize({
        qualities: 'brave',
        setQualities() {
            this.qualities = 'valiant'
        }
    })

    const $qualities = asPropIon(frog, 'qualities')

    function setQualities() {
        $qualities.set('gallant')
    }



    provide(NAME, ionize({
        $: $name,
        makeKermit
    }))

    return Component(
        <>
            <h1>Parent</h1>
            <div onClick={setQualities}>{() => frog.qualities}</div>
            <div onClick={() => frog.setQualities()}>{$qualities}</div>
            <div>{$doubleCount}</div>
            <ChildBlock />
            <SiblingBlock />
            <button onClick={() => counter.increment()}>increment</button>
            <button onClick={() => counter.decrement()}>decrement</button>
        </>
    )
}


function ChildBlock() {
    const counter = fromContext(COUNTER)

    return Component(
        <div style='outline: solid 1px gray; background-color: #C0CAAD; padding: 15px'>
            <h1>Child</h1>
            <p>
                {() => counter.$.count}
            </p>
            <GrandChildBlock></GrandChildBlock>
            <button onClick={() => counter.increment()}>increment</button>
            <button onClick={() => counter.decrement()}>decrement</button>
        </div>
    )
}


function SiblingBlock() {
    const counter = fromContext(COUNTER)

    return Component(
        <div style='outline: solid 1px gray; background-color: #B26E63'>
            <h1>Sibling</h1>
            <p>
                {() => counter.$.count}
            </p>
        </div>
    )
}

function GrandChildBlock() {
    const counter = fromContext(COUNTER)
    const $doubleCount = fromContext(DOUBLE_COUNT)
    const name = fromContext(NAME)
    const $name = asPropIon(name, '$')
    const $count = asPropIon(counter.$, 'count')



    console.log("$double count", $doubleCount)

    return Component(
        <div style='outline: solid 1px gray; background-color: #B26E63'>
            <h1 onClick={() => name.makeKermit()}>Grandchild: {$name}</h1>
            <h1 onClick={() => name.makeKermit()}>Grandchild: {() => name.$}</h1>
            <p>
                {$count}
            </p>
            <p>double: {$doubleCount}</p>
        </div>
    )
}


