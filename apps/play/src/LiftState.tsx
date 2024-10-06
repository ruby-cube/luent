//@ts-nocheck
import { NodeRef } from "@rue/lumo"
import { $, ion } from "../../../packages/quarky/src"



function ParentBlock() {

    const $count = ion(4);

    function increment() {
        $count.update(c => c + 1)
    }

    function decrement() {
        $count.update(c => c - 1)
    }

    const $doubleCount = $(() => $count() * 2)


    return {
        render:
            <>
                <h1>Hey</h1>
                <div>{$doubleCount}</div>
                <ChildBlock
                    $count={$count}
                    increment={increment}
                    decrement={decrement}
                />
                <SiblingBlock $count={$count}></SiblingBlock>
                <button onclick={increment}>increment</button>
                <button onclick={decrement}>decrement</button>
            </>
    }
}


function ChildBlock({ $count }: {
    $count?: Ion<number>;
    increment: () => void
    decrement: () => void
}) {

    return (
        <p>
            {$count}
            <button onclick={increment}>increment</button>
            <button onclick={decrement}>decrement</button>
        </p>
    )
}


function SiblingBlock({ $count }: {
    $count?: Ion<number>
}) {

    return (
        <p>
            {$count}
        </p>
    )
}


