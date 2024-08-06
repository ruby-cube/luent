import { getActiveFlask } from "@rue/flask";
import { $else, $if } from "@rue/lumo";
import { useReactivity } from "@rue/muonic";

const { $, $$, $$$, mu, o$, o$$$, set } = useReactivity()

export function TestConditional() {

    const $active = $(true)

    const list$ = o$([1, 2, 3])

    function insert() {
        mu(list$, o => {
            o.push(o.length + 1)
        })
    }

    function pop() {
        mu(list$, o => {
            o.pop
        })
    }

    

    function toggleActiveState() {
        set($active, active => !active)
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