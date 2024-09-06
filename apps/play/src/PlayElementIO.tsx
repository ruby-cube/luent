//@ts-nocheck
import { $Node } from "@rue/lumo"
import { $, $Signal } from "@rue/muonic"







function ParentBlock() {

    const childBlock = $Node(ChildBlock);

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
            <button onclick={increment}>increment</button>
            <button onclick={decrement}>decrement</button>
        </>
    )
}

function ParentBlockB() {

    const child = $Node(ChildBlock);

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
                <button onclick={increment}>increment</button>
                <button onclick={decrement}>decrement</button>
            </>
    }
}


function ChildBlock({ initialCount }: {
    initialCount?: number
}) {
    const $count = $Signal(initialCount || 0)

    function increment() {
        $count.setFrom(c => c + 1)
    }

    function decrement() {
        $count.setFrom(c => c - 1)
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




