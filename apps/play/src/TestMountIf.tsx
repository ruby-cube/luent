import { create_if, else_create, else_mount, mount_if, mx } from "@rue/lumo";
import { $, $Signal } from "@rue/muonic";

export function MountIf() {
    const $count = $Signal(0)
    const $doubleCount = $(() => $count() * 2)
    function increment() {
        $count.set(count => count + 1)
    }

    const $active = $Signal(true)
    function toggleActive() {
        $active.set(active => !active)
    }

    return mx(
        <>
            {[
                create_if($active, () =>
                    <>
                        <div>Hi</div>
                        {/* <div>{$doubleCount}</div> */}
                    </>
                ),
                else_create(() =>
                    <p>bye</p>
                )
            ]}
            <button onclick={toggleActive}>toggle</button>
        </>
    )
}