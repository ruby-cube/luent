//@ts-nocheck
import { NodeIon } from "@rue/lumo"
import { $, Ion } from "../../../packages/quarky/src"



function ParentBlock() {

    const $count = Ion(4);

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
                <button onClick={increment}>increment</button>
                <button onClick={decrement}>decrement</button>
            </>
    }
}


function ChildBlock({ $count }: {
    $count?: ReactiveIon<number>;
    increment: () => void
    decrement: () => void
}) {

    return (
        <p>
            {$count}
            <button onClick={increment}>increment</button>
            <button onClick={decrement}>decrement</button>
        </p>
    )
}


function SiblingBlock({ $count }: {
    $count?: ReactiveIon<number>
}) {

    return (
        <p>
            {$count}
        </p>
    )
}


