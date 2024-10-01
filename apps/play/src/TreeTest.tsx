import { Ion } from "../../../packages/quarky/src"
import { $await } from "../../../packages/lumo/src/component/$await"
import { If } from "@rue/lumo"

export function Root() {
    const $active = Ion(true)
    function toggleActive() {
        $active.update(value => !value)
    }
    return (
        <>
            <div>Root</div>
            <>
                {If($active, () => <div>I'm active</div>)}
            </>
            <button onClick={toggleActive}>click</button>
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
//     const $count = Ion(0)

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