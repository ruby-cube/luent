import { $Node, COMPONENT, ComponentSetup, create_if, else_create, else_mount, else_show, iterate_over, mount_if, mx, NodeEntity, preventDefault, show_if, teleportTo, useEventListener } from "@rue/lumo";
import { moveMultipleUniqueItems, useRandomColorGenerator } from "@rue/utils";
import { $Signal, __addDevName } from "@rue/muonic";
import { $, DeepReactive$, Reactive$ } from "@rue/muonic";
import { create } from "domain";


const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
    return id++;
}


export function List() {

    const list$ = DeepReactive$([
        { id: 0, content: "frog" },
        { id: 1, content: "robin" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ])

    // initializeReactiveEffect(() => {
    //     console.log("some starts with f", list$.some((item) => item.content.startsWith('f')))
    // })


    function changeContent(index: number) {
        const item$ = list$[index];
        item$.content = 'something else'
    }

    function insertItem(index: number) {
        console.log("insert item")
        list$.splice(index, 0, {
            id: genId(),
            content: (Math.random() * 100).toString(),
        })
    }


    function moveSelectedItems(index: number) {
        moveMultipleUniqueItems(selected$, list$, index)
    }

    const selected$ = Reactive$(new Set())


    function clearSelection() {
        selected$.clear()
    }

    function toggleSelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) {
        if (e.target instanceof HTMLElement && e.target.style.cursor === 'pointer') return;
        const item$ = list$[index]
        if (selected$.has(item$)) {
            selected$.delete(item$)
        }
        else {
            selected$.add(item$)
        }
    }

    function removeItem(index: number) {
        selected$.delete(list$[index])
        list$.splice(index, 1);
    }

    const $itemDiv = $Node<'div'>()

    const $alive = $Signal(true)

    function destroy() {
        $alive.setTo(false)
    }

    return mx(
        <>
            {create_if($alive, () => (

                <div>
                    <button onclick={destroy}>destroy</button>
                    <>
                        {create_if($(() => {console.log('reevaluate list length === 0'); return list$.length === 0}), () => (
                            <div
                                onclick={() => insertItem(0)}
                                style="background-color: gray; cursor: pointer"
                            >
                                insert
                            </div>
                        ))}
                        {else_create(() =>
                            iterate_over(list$, (item$, $index) => (
                                <div
                                    ref={$itemDiv}
                                    onclick={(e) => toggleSelect(e, $index())}
                                    style={[
                                        `background-color: ${randomColor.get()}`,
                                        o => {
                                            o.outline = selected$.has(item$) ? 'thick solid blue' : '';
                                        }
                                    ]}>
                                    <p
                                        onclick={(e) => removeItem($index())}
                                        style="cursor: pointer"
                                    >
                                        X
                                    </p>
                                    <li onclick={() => changeContent($index())}>
                                        {$(() => item$.content)}
                                    </li>
                                    <p>{$index}</p>
                                    <div
                                        onclick={() => insertItem($index() + 1)}
                                        style="background-color: gray; cursor: pointer"
                                    >
                                        insert
                                    </div>
                                    <div
                                        onclick={() => moveSelectedItems($index() + 1)}
                                        style="background-color: white; cursor: pointer"
                                    >
                                        insert
                                    </div>
                                </div>
                            ), 'id')
                        )}
                    </>
                    <button onclick={clearSelection}>clear</button>
                    {/* <button onclick={$if($active, capture.once(clearSelection))}>clear</button>

            <button
                onclick={[() => increment($index()), preventDefault.endHere, target(THIS_NODE), { once: true }]}
            >
                clear
            </button>

            <button
                onclick={[increment, { until: onMounted }]}
            >
                clear
            </button>
            <button
                onclick={[
                    $if($active, [
                        increment, runOnce.preventDefault, target(THIS_NODE)
                    ]),
                    $else(decrement)
                ]}
            >
                clear
            </button> */}
                </div>
            ))}
        </>
    )
}
