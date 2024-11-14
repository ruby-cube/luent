import { NodeRef, Component, If, Else, fade } from "@rue/lumo";
import {  ion } from "@rue/quarky";

export function MountIf() {
    const $count = ion(0, {
        increment() {
            $count.as($count() + 1)
        }
    })

    const $active = ion(true, {
        toggle() {
            $active.as(!$active())
        }
    })

    return Component(() =>
        <>
            <h1>Hello world</h1>
            <phase-change both={fade}>{[
                If($active, () =>
                    <div>hi</div>
                ),
                Else(() =>
                    <p>bye</p>
                )
            ]}</phase-change>
            <button on:click={$active.toggle}>toggle</button>
        </>
    )
}

// function DisplayCard({ id, title, description }) {
//     // setup logic here...
//     function select() {

//     }

//     return Component(
//         <div on:click={e => { if (e.targets('x-select')) select() }}>
//             <p x-select>{title}</p>
//             <p contenteditable>{description}</p>
//             <button on:click={e => open(id)}>open</button>
//             <ArticleBlock SlotKit={CounterKit}>{o =>
//                 <p>{o.frog}</p>
//             }</ArticleBlock>
//         </div>
//     )
// }

// function DisplayCardB({ id, title, description }) {
//     // setup logic here...
//     function select() {

//     }

//     return Component(
//         <div on:click={'x-select', e => { if (e.targets('x-select')) select() }}>
//             <p x-select>{title}</p>
//             <p contenteditable>{description}</p>
//             <button on:click={e => open(id)}>open</button>
//             <ArticleBlock SlotKit={CounterKit}>{o =>
//                 <p>{o.frog}</p>
//             }</ArticleBlock>
//         </div>
//     )
// }

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
