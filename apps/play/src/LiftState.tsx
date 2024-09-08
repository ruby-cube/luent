//@ts-nocheck
import { $Node } from "@rue/lumo"
import { $, $Signal } from "@rue/muonic"



function ParentBlock() {

    const $count = $Signal(4);

    function increment() {
        $count.setFrom(c => c + 1)
    }

    function decrement() {
        $count.setFrom(c => c - 1)
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
    $count?: AtomicSignal<number>;
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
    $count?: AtomicSignal<number>
}) {

    return (
        <p>
            {$count}
        </p>
    )
}


