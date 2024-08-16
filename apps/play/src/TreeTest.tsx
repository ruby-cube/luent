import { $Signal } from "@rue/muonic"
import { $await } from "../../../packages/lumo/src/component/$await"
import { $if } from "@rue/lumo"

export function Root() {
    const $active = $Signal(true)
    function toggleActive() {
        $active.set(value => !value)
    }
    return (
        <>
            <div>Root</div>
            <>
                {$if($active, () => <div>I'm active</div>)}
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
//         $count.set(c => c + 1)
//     })

//     return (
//         <>
//             <div>GrandChild</div>
//             <p>{$count}</p>
//         </>
//     )
// }