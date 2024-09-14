import { $else, $if } from "@rue/lumo";
import { $, o$, $Signal } from "@rue/muonic";


export function TestConditional() {

    const $active = $Signal(true)

    const list$ = o$([1, 2, 3])

    function insert() {
        list$.push(list$.length + 1)
    }

    function pop() {
        list$.pop
    }



    function toggleActiveState() {
        $active.setFrom(active => !active)
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