import { CreateIf, ElseCreate, ElseMount, MountIf, mx } from "@rue/lumo";
import { $, $Signal, isAnySignal } from "@rue/muonic";

export function MountIf() {
    // const $count = $Signal(0)
    // const $doubleCount = $(() => $count() * 2)
    // function increment() {
    //     $count.update(count => count + 1)
    // }

    // const $count2 = $Signal(0)
    // const $sum = $(() => $count() + $count2())
    // function increment2() {
    //     $count2.update(count => count + 1)
    // }


    const $active = $Signal(false)
    function toggleActive() {
        $active.update(active => !active)
    }

    // const $ready = $Signal(true)
    // function toggleReady() {
    //     $ready.update(ready => !ready)
    // }


    // const $activeAndReady = $(() => $active() && $ready(), true)

    return (
        <>
            {/* {[
                CreateIf($active, () =>
                    <>
                        <div>Hi</div>
                    </>
                ),
                ElseCreate(() =>
                    <p>bye</p>
                )
            ]} */}
            {/* <div>Both: {$activeAndReady}</div> */}
            <button onclick={toggleActive}>toggle active {$active}</button>
            {/* <button onclick={toggleReady}>toggle ready {$ready}</button> */}
            {/* <div>{$sum}</div>
            <button onclick={increment}>increment {$count}</button>
            <button onclick={increment2}>increment {$count2}</button> */}
        </>
    )
}