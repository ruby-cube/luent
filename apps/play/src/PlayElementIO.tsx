//@ts-nocheck
import { NodeRef } from "@rue/lumo"
import { $, ion } from "../../../packages/quarky/src"







function ParentBlock() {

    const childBlock = NodeRef(ChildBlock);

    function increment() {
        childBlock.increment()
    }

    function decrement() {
        childBlock.decrement()
    }

    const $doubleCount = $(() => childBlock.$count() * 2)


    return (
        <>
            <h1>Hey</h1>
            <div>{$doubleCount}</div>
            <ChildBlock initialCount={4} ref={childBlock}></ChildBlock>
            <button on:click={increment}>increment</button>
            <button on:click={decrement}>decrement</button>
        </>
    )
}

function ParentBlockB() {

    const child = NodeRef(ChildBlock);

    function increment() {
        child.increment()
    }

    function decrement() {
        child.decrement()
    }

    const $doubleCount = $(() => childBlock.$count() * 2)


    return {
        render:
            <>
                <h1>Hey</h1>
                <div>{$doubleCount}</div>
                <ChildBlock initialCount={4} ref={child}></ChildBlock>
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




