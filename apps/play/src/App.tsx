import { $else, $elseIf, $if, forEachIn, NodeConfig, RenderSlotted } from "@rue/lumo";
import { useReactivity } from "@rue/muonic"
import { watchRenderEffect } from "../../../packages/lumo/src/watchForRender";
import { count } from "console";


const { $, set } = useReactivity();

export function App() {
    const $count = $(0)

    function increment() {
        set($count, count => count + 1)
    }

    function decrement() {
        set($count, count => count - 1)
    }

    const $visible = $(true, undefined, '$visible');
    const $dark = $(true, undefined, '$dark');

    function toggleVisibility() {
        set($visible, visible => !visible)
    }

    function toggleDarkness() {
        set($dark, dark => !dark)
    }

    return (
        <div>
            <>
                {$if($visible, 'create', () =>
                    <>
                        {/* <p>{$count}</p> */}
                        <p>play!</p>
                    </>
                )}
                {$elseIf($dark, () =>
                    <p>dark</p>
                )}
                {$else(() =>
                    <p>gone</p>)}
            </>
            <button onclick={increment}>increment</button>
            <button onclick={decrement}>decrement</button>
            <button onclick={toggleVisibility}>show/hide</button>
            <button onclick={toggleDarkness}>toggle darkness</button>
        </div>
    )
}