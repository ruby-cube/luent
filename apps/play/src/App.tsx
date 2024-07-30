import { $else, $elseIf, $if, ComponentSetup, forEachIn, NodeConfig, RenderSlotted } from "@rue/lumo";
import { useReactivity, watchEffect } from "@rue/muonic"
import { idleLoadComponent, loadComponent } from "../../../packages/lumo/src/loadComponent";
import { TestBlock } from "./TestBlock";


const { $, set } = useReactivity();

const loadSideBlock = idleLoadComponent({
    load: () => {
        const result = import('./SideBlock').then(({ SideBlock }) => SideBlock)
        console.log("what's this?", result)
        return result;
    }
});

export function App() {
    const $count = $(0)

    function increment() {
        set($count, count => count + 1)
    }

    function decrement() {
        set($count, count => count - 1)
    }

    const $visible = $(true);
    const $dark = $(true);

    function toggleVisibility() {
        set($visible, visible => !visible)
    }

    function toggleDarkness() {
        set($dark, dark => !dark)
    }

    const SideBlock = loadSideBlock()

    const $active = $(false);

    function activate() {
        set($active, (v) => !v)
    }

    return (
        <div>
            {/* <>
                {$if($loaded, () => (
                    <div>hi</div>
                ))}
            </> */}
            <article>
                <SideBlock frog='sir robin'></SideBlock>
            </article>
            <TestBlock $active={$active}></TestBlock>
            <button onclick={activate}>activate</button>
            <>
                {$if($visible, 'create', () =>
                    <>
                        <p>{$count}</p>
                        <p>play!</p>
                    </>
                )}
                {/* {$elseIf($dark, () =>
                    <p>dark</p>
                )}
                {$else(() =>
                    <p>gone</p>)} */}
            </>

            <button onclick={increment}>increment</button>
            <button onclick={decrement}>decrement</button>
            <button onclick={toggleVisibility}>show/hide</button>
            <button onclick={toggleDarkness}>toggle darkness</button>
        </div>
    )
}

