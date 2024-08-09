//@ts-nocheck
import { $else, $elseIf, $if, COMPONENT, ComponentSetup, ConditionalRenderKit, expose, forEachIn, NodeEntity, NodeRef, onMounted, RenderSlotted, teleportTo, useEventListener } from "@rue/lumo";
import { Signal, useReactivity, watch, initializeEffect, isReactiveModel } from "@rue/muonic"
import { idleLoadComponent, loadComponent } from "../../../packages/lumo/src/component/loadComponent";
import { useRandomColorGenerator } from "@rue/utils";
import { __addDevName } from "@rue/muonic/debug";
import { clear } from "console";
import { thisAlone } from "../../../packages/lumo/src/element/event-modifiers";


const { $, set, o$, mu, $$, $$$, o$$$ } = useReactivity();
const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
    return id++;
}


export function List() {

    const list$ = o$$$([
        { id: 0, content: "frog" },
        { id: 1, content: "robin" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ])

    // initializeEffect(() => {
    //     console.log("some starts with f", list$.some((item) => item.content.startsWith('f')))
    // })


    function changeContent(index: number) {
        const item$ = list$[index];
        mu(item$, o => {
            o.content = 'something else'
        })
    }

    function insertItem(index: number) {
        mu(list$, list => {
            list.splice(index, 0, {
                id: genId(),
                content: (Math.random() * 100).toString(),
            })
        })
    }

    const selected$ = o$(new Set())


    function clearSelection() {
        mu(selected$, o => {
            selected$.clear()
        })
    }

    function toggleSelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) {
        const item$ = list$[index]
        if (selected$.has(item$)) {
            mu(selected$, o => {
                o.delete(item$)
            })
        }
        else {
            mu(selected$, o => {
                o.add(item$)
            })
        }
    }

    function removeItem(index: number) {
        mu(list$, list => {
            selected$.delete(list[index])
            list.splice(index, 1);
        })
    }


    return (
        <div>
            <>
                {$if($(() => list$.length === 0), 'create', () => (
                    <div

                        onclick={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                ))}
                {$else(() =>
                    forEachIn(list$, (item$, $index) => (
                        <div
                            onclick={thisAlone((e) => toggleSelect(e, $index()))}
                            style={[
                                `background-color: ${randomColor.get()}`,
                                o => {
                                    o.outline = selected$.has(item$) ? 'thick solid blue' : '';
                                }
                            ]}>
                            <p
                                onclick={[(e) => removeItem($index())]}
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
                                onclick={() => insertSelectedItem($index() + 1)}
                                style="background-color: white; cursor: pointer"
                            >
                                insert
                            </div>
                        </div>
                    ), 'id')
                )}
            </>
            <button onclick={clearSelection}>clear</button>
            {/* <button onclick={$if($active, capture.once(clearSelection))}>clear</button> */}

            {/* <button
                onclick={thisAlone(preventDefault(stopPropagation(allowDefault((e) => { clearSelection(e, index) }))))}
            >clear</button> */}
        </div>
    )
}
