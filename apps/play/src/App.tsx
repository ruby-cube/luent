import { $else, $elseIf, $if, COMPONENT, ComponentSetup, ConditionalRenderKit, expose, forEachIn, NodeEntity, NodeRef, onMounted, RenderSlotted, teleportTo, useEventListener } from "@rue/lumo";
import { Signal, useReactivity, watchEffect } from "@rue/muonic"
import { idleLoadComponent, loadComponent } from "../../../packages/lumo/src/component/loadComponent";
import { useRandomColorGenerator } from "@rue/utils";


const { $, set, o$, mu } = useReactivity();
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

export function List() {
    const list$ = o$([
        { id: 0, content: "frog" },
        { id: 1, content: "frog" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ])
    const $list = $([
        { id: 0, content: "frog" },
        { id: 1, content: "frog" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ])

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
            console.log(list);
        })
    }

    const { openModal } = useModal();

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
                    forEachIn(list$, (item, $index) => (
                        <div style={`background-color: ${randomColor.get()}`}>
                            <p
                                onclick={() => removeItem($index())}
                                style="cursor: pointer"
                            >
                                X
                            </p>
                            <li>{item.content}</li>
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