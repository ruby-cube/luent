import { $Signal } from "@rue/muonic"
import { $await } from "../../../packages/lumo/src/component/$await"
import { create_if } from "@rue/lumo"

export function Root() {
    const $active = $Signal(true)
    function toggleActive() {
        $active.update(value => !value)
    }
    return (
        <>
            <div>Root</div>
            <>
                {create_if($active, () => <div>I'm active</div>)}
            </>
            <button onclick={toggleActive}>click</button>
        </>
    )
}

// function Child() {
//     return (
//         <>
//             <div>Child</div>
//             <GrandChild></GrandChild>
//         </>
//     )
// }

// function GrandChild() {
//     const $count = $Signal(0)

//     const promise = new Promise((resolve) => {
//         setTimeout(() => {
//             resolve(2)
//         }, 3000)
//     })

//     promise.then(() => {
//         $count.update(c => c + 1)
//     })

//     return (
//         <>
//             <div>GrandChild</div>
//             <p>{$count}</p>
//         </>
//     )
// }