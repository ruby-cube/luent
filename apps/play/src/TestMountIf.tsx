import { create_if, else_create, else_mount, mount_if, mx } from "@rue/lumo";
import { $, $Signal } from "@rue/muonic";

export function MountIf() {
    const $count = $Signal(0)
    const $doubleCount = $(() => $count() * 2)
    function increment() {
        $count.set(count => count + 1)
    }

    const $count2 = $Signal(0)
    const $sum = $(() => $count() + $count2())
    function increment2() {
        $count2.set(count => count + 1)
    }


    const $active = $Signal(false)
    function toggleActive() {
        $active.set(active => !active)
    }

    const $ready = $Signal(true)
    function toggleReady() {
        $ready.set(ready => !ready)
    }


    const $activeAndReady = $(() => $active() && $ready(), true)

    return mx(
        <>
            {[
                create_if($activeAndReady, () =>
                    <>
                        <div>Hi</div>
                    </>
                ),
                else_create(() =>
                    <p>bye</p>
                )
            ]}
            <div>Both: {$activeAndReady}</div>
            <button onclick={toggleActive}>toggle active {$active}</button>
            <button onclick={toggleReady}>toggle ready {$ready}</button>
            {/* <div>{$sum}</div>
            <button onclick={increment}>increment {$count}</button>
            <button onclick={increment2}>increment {$count2}</button> */}
        </>
    )
}