import { getAttributes, $Ion, Ion, NodeRef, v, prep } from "@rue/lumo"
import { AtomicIon, ion } from "../../../packages/quarky/src"



function ParentBlock() {

    const $count = ion(4, {
        increment() {
            this.as($count() + 1)
        },
        decrement() {
            this.as($count() - 1)
        }
    });


    const $doubleCount = ion(() => $count() * 2)


    return {
        render:
            <>
                <div>{$doubleCount()}</div>
                <ChildBlock $count={$count}></ChildBlock>
                <SiblingBlock count={$count() + 1}></SiblingBlock>
                <button on:click={$count.increment}>increment</button>
                <button on:click={$count.decrement}>decrement</button>
            </>
    }
}

function assertEvenNumber(value: any): asserts value is number {
    if (value % 2 !== 0) throw 'invalid'
}



function ChildBlock(
    input = getAttributes({
        count: $Ion<number, { increment: () => void; decrement: () => void; }>,
    })
) {
    const { $count } = prep(input)

    return (
        <p>
            {$count}
            <button on:click={$count.increment}>increment</button>
            <button on:click={$count.decrement}>decrement</button>
        </p>
    )
}



function SiblingBlock(
    input = getAttributes({
        count: Ion<number>
    })
) {
    const { $count } = prep(input)

    return (
        <p>
            {$count}
        </p>
    )
}


