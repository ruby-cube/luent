//@ts-nocheck
import { NodeRef, Component, If, Else, stopPropagation, watch, preventDefault } from "@rue/lumo";
import { AFTER_RENDER, BEFORE_RENDER, AtomicIon, ion, ON_RENDER, SYNC } from "@rue/quarky";

export function MountIf() {
    const $count = ion(0, {
        increment() {
            $count.as($count() + 1)
        }
    })
    // const $doubleCount = ion(() => $count() * 2)

    // const $count2 = ion(0)
    // const $sum = $(() => $count() + $count2())
    // function increment2() {
    //     $count2.update(count => count + 1)
    // }


    const $active = ion(true, {
        toggle() {
            $active.as(!$active())
        }
    })

    // const $ready = ion(true)
    // function toggleReady() {
    //     $ready.update(ready => !ready)
    // }

    // watch(() => $count() * 2, (double) => {
    //     console.log("double count!", double)
    // })

    function isTarget(n: any, e: any) {
        return true;
    }

    // const $activeAndReady = $(() => $active() && $ready(), true)
    return Component(() =>
        <>
            <h1>Hello world</h1>
            {[
                If($active, () =>
                    <div>hi</div>
                ),
                Else(() =>
                    <p>bye</p>
                )
            ]}

            {/* {If($active()),
                <div>hi</div>
            }
            {Else,
                <p>bye</p>
            } */}

            <button
                data-frog={'hi'}
                onV:click={e => console.log('hi')}
                on:click={target('this', 'x-select', e =>
                    console.log('hi')
                )}
            >
                toggle active {$active()}
            </button>
            <button
                data-frog={'hi'}
                onV:click={e => console.log('hi')}
                on:click={['x', 'x-select',
                    incrementCount
                ]}
            >
                toggle active {$active()}
            </button>
            <button
                data-frog={'hi'}
                onV:click={e => console.log('hi')}
                on:click={'x', 'x-select', e => {
                    $active.toggle()
                    e.preventDefault()
                }}
            >
                toggle active {$active()}
            </button>
            <button
                data-frog={'hi'}
                onV:click={e => console.log('hi')}
                on:click={[
                    target('this', 'select'), e => {
                        $active.toggle
                    },
                    selectItem,
                    target('this'), increment
                ]}
            >
                toggle active {$active()}
            </button >
            {/* <div>Both: {$activeAndReady}</div> */}
            {/* <button on:click={increment}>increment {$count}</button> */}
            {/* <button on:click={toggleReady}>toggle ready {$ready}</button> */}
            {/* <div>{$sum}</div>
            <button on:click={increment2}>increment {$count2}</button> */}
        </>
    )
}

function DisplayCard({ id, title, description }) {
    // setup logic here...
    function select() {

    }

    return Component(
        <div on:click={e => { if (e.targets('x-select')) select() }}>
            <p x-select>{title}</p>
            <p contenteditable>{description}</p>
            <button on:click={e => open(id)}>open</button>
            <ArticleBlock SlotKit={CounterKit}>{o =>
                <p>{o.frog}</p>
            }</ArticleBlock>
        </div>
    )
}

function DisplayCardB({ id, title, description }) {
    // setup logic here...
    function select() {

    }

    return Component(
        <div on:click={'x-select', e => { if (e.targets('x-select')) select() }}>
            <p x-select>{title}</p>
            <p contenteditable>{description}</p>
            <button on:click={e => open(id)}>open</button>
            <ArticleBlock SlotKit={CounterKit}>{o =>
                <p>{o.frog}</p>
            }</ArticleBlock>
        </div>
    )
}

function CounterKit() {
    return {
        $count: ion(0)
    }
}

function ArticleBlock(setup: {
    Slot: (setup: { frog: string }) => any;
    SlotKit: typeof CounterKit //TODO: auto add ReturnType of SlotKit to setup props
}) {

}
// function Counter() {
//     const _this = $thisComponent()
//     const $count = ion(0)

//     const $button = NodeRef('button')
//     const $countDiv = NodeRef('div')

//     // onNodesCreated(
//     //     [$button, $countDiv],
//     //     ([button, countDiv]) => {

//     //     }
//     // )

//     watch($count, () => {
//         console.log("sync phase")
//     }, { phase: SYNC })

//     watch($count, () => {
//         console.log("pre-render phase")
//     }, { phase: BEFORE_RENDER })

//     watch($count, () => {
//         console.log("render phase")
//     }, { phase: ON_RENDER })

//     watch($count, () => {
//         console.log("post-render phase")
//     }, { phase: AFTER_RENDER })

//     _this.onCreated(() => {
//         console.log("created")
//         const button = $button()
//         const countDiv = $countDiv()
//         console.log("node ref", button, countDiv)
//     })

//     // onActivated(() => {
//     //     console.log("activated yo")
//     // })

//     // onDeactivate(() => {
//     //     console.log("deactivate")
//     // })

//     _this.onDestroy(() => {
//         console.log("destroyd")
//     })

//     $count.as(1)

//     return Component(
//         <>
//             <div ref={$countDiv}>{$count}</div>
//             <button on:click-this-$button-v={[$count.as($count() + 1), stopPropagation]} ref={$button}>increment</button >
//             {/* <Counter>{$count()}</Counter> */}
//         </>
//     )
// }


// slot: renderfunction, component, readonly ion, primitive value
