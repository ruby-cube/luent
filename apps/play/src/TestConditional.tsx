import { $else, $if } from "@rue/lumo";
import { $, $Model, $State } from "@rue/muonic";


export function TestConditional() {

    const $active = $State(true)

    const list$ = $Model([1, 2, 3])

    function insert() {
        list$.push(list$.length + 1)
    }

    function pop() {
        list$.pop
    }



    function toggleActiveState() {
        $active.update(active => !active)
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