import { $Node, $Nodes, Component, CreateIf, ElseCreate, For} from "@rue/lumo";
import { moveMultipleUniqueItems, useRandomColorGenerator } from "@rue/utils";
import { $State, __addDevName, $, $Derived, ionic } from "@rue/muonic";
import { watch } from "../../../packages/lumo/src/watch/watchAndPreserve";


const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
    return id++;
}


// const $count = $State(0)
// watch($(doubleCount => $count() + 2), () => {  

// })


// type RedefineReturn <P, M extends string, R extends >= <T extends Frog>(this: T, ...args: Parameters<Frog['getQualitiesB']>) => T["qualities"]

// const blub = {
//     getQualities<T extends Frog>(this: T): T['qualities'] {
//         return this.qualities;
//     }
// }

// type Star = {
//     fish: () => DeepReactiveModel<Frog>['qualities']
// } & ThisType<DeepReactiveModel<Frog>>

// const star: Star = {
//     fish() {
//         return this.qualities
//     }
// }

// const something = star.fish()


// const frog = new Frog() as FrogB
// const frog$$ = ionic(frog)

// const q = frog$$.qualities
// const qual$$ = frog$$.getQualitiesB()
// const qual = frog.getQualitiesB()

function App(){
    return Component(
        <List dog="kjk"></List>,
        {
            frog: "kermit"
        }
    )
}


export function List(
    setup: {
        dog: string
    }
) {

    const $list = ionic([
        { id: 0, content: "frog" },
        { id: 1, content: "robin" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ])


    // $list[0] = { id: 0, content: "fly" }

    // const content = $list[0]



    // const frog$ = ionic({
    //     name: "Sir Robin"
    // })

    // const $frogName = asIon(frog$, "name")

    // function changeFrogName() {
    //     $frogName.update(name => name + "kermito")
    // }


    // watch($frogName, (newVal, old) => {
    //     console.log("changed", newVal, old)
    // })

    // console.log("is reactive?", isReactiveModel($list), $list)
    // console.log("is deep", isDeepReactive($list))
    // console.log("isReactive //true", isReactiveModel($list[0]))
    // console.log("isShallowReactive // true", isReactiveModel($list._), $list._[0])
    // console.log("isreactive //false", isReactiveModel($list._[0]))

    // watch($(() => $list[3]), (newValue, old) => {
    //     console.log("index 3", newValue, old)
    // })

    // console.log("works?", $list instanceof Array)

    // watch($list, (list, mutations) => {
    //     // console.log("mutations", mutations)
    // })

    // $initializeEffect(() => {
    //     console.log("some starts with f", $list.some((item) => item.content.startsWith('f')))
    // })

    // function changeItem(index: number) {
    //     $list._$[index] = {
    //         id: genId(),
    //         content: (Math.random() * 100).toString(),
    //     }
    // }


    function changeContent(index: number) {
        console.log("changing content")
        const $item = $list[index];
        $item.content = 'something else'
    }


    function insertItem(index: number) {
        const removed = $list.splice(index, 0, {
            id: genId(),
            content: (Math.random() * 100).toString(),
        })
    }

    // function z$<T extends AnyObject>(value: T): DeepReactiveModel<T> {
    //     return value as DeepReactiveModel<T>;
    // }

    function moveSelectedItems(index: number) {
        moveMultipleUniqueItems($selected, $list, index)
    }

    const $selected = ionic(new Set())


    function clearSelection() {
        $selected.clear()
    }

    function toggleSelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) {
        if (e.target instanceof HTMLElement && e.target.style.cursor === 'pointer') return;
        const $item = $list[index]
        if ($selected.has($item)) {
            $selected.delete($item)
        }
        else {
            $selected.add($item)
        }
    }

    function removeItem(index: number) {
        $selected.delete($list[index])
        $list.splice(index, 1);
    }

    const $itemDiv = $Nodes('div')

    const $alive = $State(true)

    function destroy() {
        $alive.setTo(false)
    }
    // const $item = $list[0]
    //     watch($(() => $item.content), (newValue, oldValue) => {
    //         console.log("changed", newValue, oldValue)
    //     }, { phase: Phase.RENDER })
    //     console.log("------------")

    // setTimeout(()=>{
    //     changeContent(0)
    // }, 1)

    const $listIsEmpty = $Derived(() => $list.length === 0)
    watch($listIsEmpty, () => {
        console.log("list is empty!")
    })

    return Component(
        <>
            <>
                {CreateIf($listIsEmpty, () => (
                    <div
                        onclick={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                ))}
                {ElseCreate(() =>
                    For($list, ($item, $index) => (
                        <div
                            ref={$itemDiv}
                            onclick={(e) => toggleSelect(e, $index())}
                            style={[
                                `background-color: ${randomColor.get()}`,
                                o => {
                                    o.outline = $selected.has($item) ? 'thick solid blue' : '';
                                }
                            ]}>
                            <p
                                onclick={(e) => removeItem($index())}
                                style="cursor: pointer"
                            >
                                X
                            </p>

                            <li onclick={() => changeContent($index())}>
                                {$(() => $item.content)}
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
        </>
        //             {/* <button onclick={$if($active, capture.once(clearSelection))}>clear</button>

        //     <button
        //         onclick={[() => increment($index()), preventDefault.endHere, target(THIS_NODE), { once: true }]}
        //     >
        //         clear
        //     </button>

        //     <button
        //         onclick={[increment, { until: onMounted }]}
        //     >
        //         clear
        //     </button>
        //     <button
        //         onclick={[
        //             $if($active, [
        //                 increment, runOnce.preventDefault, target(THIS_NODE)
        //             ]),
        //             $else(decrement)
        //         ]}
        //     >
        //         clear
        //     </button> */}
        //         </div >
        //     ))}
        // </>
    )
}
