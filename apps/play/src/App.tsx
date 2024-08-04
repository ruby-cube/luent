import { $else, $elseIf, $if, COMPONENT, ComponentSetup, ConditionalRenderKit, expose, forEachIn, NodeEntity, NodeRef, onMounted, RenderSlotted, teleportTo, useEventListener } from "@rue/lumo";
import { Signal, useReactivity, watch, watchEffect } from "@rue/muonic"
import { idleLoadComponent, loadComponent } from "../../../packages/lumo/src/component/loadComponent";
import { useRandomColorGenerator } from "@rue/utils";
import { __addDevName } from "@rue/muonic/debug";


const { $, set, o$, mu, $$, $$$, o$$$ } = useReactivity();
const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
    return id++;
}

const loadSideBlock = idleLoadComponent({
    load: () => import('./SideBlock').then(({ SideBlock }) => SideBlock),
    Placeholder() {
        return <div>Eep! I'm not ready</div>
    }
});

const onClick = useEventListener('click');

// shallow reactive model o$
// deep reactive model o$$$
// shallow signal $ (also derived signal)
// deep signal $$$
// memo$()

export function List() {

    const $active = $(true)
    if (__DEV__) __addDevName($active, '$active')

        const $ready = $(true)
    if (__DEV__) __addDevName($ready, '$ready')


    const list$ = o$$$([
        { id: 0, content: "frog" },
        { id: 1, content: "frog" },
        { id: 2, content: "fly" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ])


//     watchEffect(()=>{
//         list$[0].content
//     }, {
//         onTrack(dep){
// console.log(dep)
//         }
//     })
    
    // watchEffect(()=>{

    watch(list$, () => {
        console.log(`list$ changed!`)
    }, {
        // onTrigger() {
        //     console.log("list$ triggered")
        //     console.trace()
        // },
        // onTrack(){
        //     console.log("list tracked!!")
        //     console.trace()
        // }
    })
    // })

    const $list = $$$([
        { id: 0, content: "frog" },
        { id: 1, content: "frog" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ])

    function changeContent(index: number) {
        const item$ = list$[index];
        mu(item$, o => {
            o.content = 'something else'
        })
    }
    // const $listUI = $($list().map((item)=>({id: item.id, selected: false})))

    function insertItem(index: number) {
        // set($list, list => {
        //     const _list = [...list]
        //     _list.splice(index, 0, {
        //         id: genId(),
        //         content: (Math.random() * 100).toString(),
        //     })
        //     return _list;
        // })
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
        // set($list, list => {
        //     const _list = [...list]
        //     _list.splice(index, 1);
        //     console.log(list);
        //     return _list
        // })
        mu(list$, list => {
            list.splice(index, 1);
        })
    }

    const { openModal } = useModal();

    // const frog$ = o$({
    //     name: "sir robin"
    // })

    // function changeFrogName() {
    //     mu(frog$, o => {
    //         o.name = o.name === "kermit" ? "sir robin" : "kermit"
    //     })
    // }

    // watch($(() => frog$.name.last), (value, oldValue, ops) => {

    // })

    // watch($(frog$, 'name.last'), (value, oldValue, ops) => {

    // })

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
            <button onclick={openModal}>open</button>
        </div>
    )
}

function useModal() {
    const dialog_box = new NodeRef<typeof DialogBox>()

    function openModal() {
        dialog_box.o!.open()
    }

    teleportTo('body',
        <DialogBox ref={dialog_box} />
    )

    return {
        openModal
    }
}

function VisibilityBlock() {
    const $visible = $(false);
    __addDevName($visible, '$visible')

    function toggleVisibility() {
        set($visible, visibility => !visibility)
    }
    return (
        <>
            <div style="display: flex">
                {$if($visible, 'show', () => (
                    <>
                        <div>surprise</div>
                        <div>surprise!</div>
                        <div>surprise!!</div>
                    </>
                ))}
                {$else(() => (
                    <div>:)</div>
                ))}
            </div>
            <button onclick={toggleVisibility}>show/hide</button>
        </>
    )
}

export function App() {
    return (
        <List></List>
    )
}


function HereBlock(props: { $active: Signal<boolean> }) {
    const { $active } = props;

    return $if($active, 'show', () => (
        <p>I AM HERE</p>
    ))
}

function DialogBox() {
    const $open = $(false)
    __addDevName($open, '$open')

    function open() {
        console.log("open sesame")
        set($open, () => true)
    }

    function close() {
        set($open, () => false)
    }


    return [
        expose({
            open,
            close
        }),

        <dialog style="background-color: gray" open={$open}>
            Stop
            <button onclick={close}>close</button>
        </dialog>
    ]
}