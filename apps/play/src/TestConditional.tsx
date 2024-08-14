import { getActiveFlask } from "@rue/flask";
import { $else, $if } from "@rue/lumo";
import { $, toReactive, toSignal } from "@rue/muonic";


export function TestConditional() {

    const $active = toSignal(true)

    const list$ = toReactive([1, 2, 3])

    function insert() {
        list$.push(list$.length + 1)
    }

    function pop() {
        list$.pop
    }



    function toggleActiveState() {
        $active.set(active => !active)
    }


    return (
        <>
            <>
                {$if($(() => $active()), 'create', () => (
                    <div>hi</div>
                )
                )}
                {$else(() => (
                    <div>ho</div>
                ))}
            </>
            <button onclick={toggleActiveState}>click</button>
        </>
    )
}