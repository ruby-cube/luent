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

    initializeEffect(() => {
        console.log("some starts with f", list$.some((item) => item.content.startsWith('f')))
    })

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

    const deleteBtnRef = new NodeRef()
    const insertBtnRef = new NodeRef()

    function toggleSelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) {
        if (e.target === deleteBtnRef.o[index] || e.target === insertBtnRef.o[index]) return;
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

    onMounted(() => {
        console.log(insertBtnRef.o)
    })

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
                        onclick={(e) => toggleSelect(e, $index())}
                            style={[
                                `background-color: ${randomColor.get()}`,
                                o => {
                                    o.outline = selected$.has(item$) ? 'thick solid blue' : '';
                                    console.log("running outline effect")
                                }
                            ]}>
                            <p
                                onclick={() => removeItem($index())}
                                style="cursor: pointer"
                                ref={deleteBtnRef}
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
                                ref={insertBtnRef}
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
