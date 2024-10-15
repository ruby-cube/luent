//@ts-nocheck
import { Component, fromContext, Provide, TypedKey } from "@rue/lumo"
import { DerivedIon, ion, ionize } from "@rue/quarky";
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon";

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

type Context = {
    onCreated: (cb: Function) => void
}
function getContext() {
    return {} as Context
}
function $this() {
    return {} as Context
}

export function ParentBlock(
    setup: {
        content: string,
    },
    provide: Provide
) {
    const o = getContext()
    const { content } = setup

    const _this = $this()

    _this.onCreated(() => {

    })

    const counter = provide(COUNTER, new Counter());
    const $doubleCount = provide(DOUBLE_COUNT, ion(() => counter.$.count * 2));

    const $name = ion("Sir Robin",
        {
            makeBrave() {
                $name.as($name() + 'The Brave')
            },
            makeKermit() {
                console.log("make kermit")
                $name.as('Kermit')
            }
        })


    const $frog = ionize({
        qualities: 'brave'
    }, {
        setQualities() {
            $frog.qualities = 'valiant'
        }
    })

    const $qualities = ion.from($frog, 'qualities',
        {
            set: 'setQualities'
        })

    provide(NAME, ionize({
        $: $name,
        makeKermit: $name.makeKermit
    }))

    return Component(
        <>
            <h1>Parent</h1>
            <div onclick={$qualities.set}>{() => $frog.qualities}</div>
            <div onclick={() => $frog.setQualities()}>{$qualities}</div>
            <div>{$doubleCount}</div>
            <ChildBlock />
            <SiblingBlock />
            <button onclick={() => counter.increment()}>increment</button>
            <button onclick={() => counter.decrement()}>decrement</button>
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
            <button onclick={() => counter.increment()}>increment</button>
            <button onclick={() => counter.decrement()}>decrement</button>
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
            <h1 onclick={() => name.makeKermit()}>Grandchild: {$name}</h1>
            <h1 onclick={() => name.makeKermit()}>Grandchild: {() => name.$}</h1>
            <p>
                {$count}
            </p>
            <p>double: {$doubleCount}</p>
        </div>
    )
}


