import { Else, If } from "@rue/lumo";
import { $, ionize, ion } from "../../../packages/quarky/src";


export function TestConditional() {

    const $active = ion(true)

    const list$ = ionize([1, 2, 3])

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
                {If($(() => $active()), 'create', () => (
                    <div>hi</div>
                )
                )}
                {Else(() => (
                    <div>ho</div>
                ))}
            </>
            <button onClick={toggleActiveState}>click</button>
        </>
    )
}