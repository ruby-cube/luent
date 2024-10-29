//@ts-nocheck
import { NodeRef } from "@rue/lumo"
import { $, ion } from "../../../packages/quarky/src"



function ParentBlock() {

    const initialCount = 4;

    const child = NodeRef(ChildBlock);
    const sibling = NodeRef(SiblingBlock);

    function increment() {
        child.increment()
        sibling.increment()
    }

    function decrement() {
        child.decrement()
        sibling.decrement()
    }

    const $doubleCount = $(() => childBlock.$count() * 2)


    return {
        render:
            <>
                <h1>Hey</h1>
                <div>{$doubleCount}</div>
                <ChildBlock initialCount={initialCount} ref={child}></ChildBlock>
                <SiblingBlock initialCount={initialCount} ref={sibling}></SiblingBlock>
                <button on:click={increment}>increment</button>
                <button on:click={decrement}>decrement</button>
            </>
    }
}


function ChildBlock({ initialCount }: {
    initialCount?: number
}) {
    const $count = ion(initialCount || 0)

    function increment() {
        $count.update(c => c + 1)
    }

    function decrement() {
        $count.update(c => c - 1)
    }

    return {
        expose: {
            $count,
            increment,
            decrement
        },
        render:
            <p>
                {$count}
            </p>
    }
}


function SiblingBlock({ initialCount }: {
    initialCount?: number
}) {
    const $count = ion(initialCount || 0)

    function increment() {
        $count.update(c => c + 1)
    }

    function decrement() {
        $count.update(c => c - 1)
    }

    return {
        expose: {
            $count,
            increment,
            decrement
        },
        render:
            <p>
                {$count}
            </p>
    }
}


