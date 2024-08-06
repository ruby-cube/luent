import { $else, $elseIf, $if, COMPONENT, ComponentSetup, ConditionalRenderKit, expose, forEachIn, NodeEntity, NodeRef, onMounted, RenderSlotted, teleportTo, useEventListener } from "@rue/lumo";
import { Signal, useReactivity, watch, initializeEffect, isReactiveModel } from "@rue/muonic"
import { idleLoadComponent, loadComponent } from "../../../packages/lumo/src/component/loadComponent";
import { useRandomColorGenerator } from "@rue/utils";
import { __addDevName } from "@rue/muonic/debug";


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

    function selectItem(index: number) {

    }

    function removeItem(index: number) {
        mu(list$, list => {
            list.splice(index, 1);
        })
    }

    watch($(() => list$.length), ()=>{
        console.log("list length changed")
    })

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
                        <div style={`background-color: ${randomColor.get()}`}>
                            <p
                                onclick={() => removeItem($index())}
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
                        </div>
                    ), 'id')
                )}
            </>
        </div>
    )
}
