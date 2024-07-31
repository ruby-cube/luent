//@ts-nocheck
import { $else, $elseIf, $if, COMPONENT, Component, ComponentSetup, ConditionalRenderKit, expose, forEachIn, NodeSetup, NodeEntity, NodeRef, onMounted, RenderSlotted, teleportTo, useEventListener } from "@rue/lumo";
import { Signal, useReactivity, watchEffect } from "@rue/muonic"
import { idleLoadComponent, loadComponent } from "../../../packages/lumo/src/component/loadComponent";
import { TestBlockA } from "./TestBlock";
import { Sign } from "crypto";


const { $, set } = useReactivity();

const loadSideBlock = idleLoadComponent({
    load: () => import('./SideBlock').then(({ SideBlock }) => SideBlock),
    Placeholder() {
        return <div>Eep! I'm not ready</div>
    }
});

const onClick = useEventListener('click');

export function List() {
    const $list = $([{ id: "one", content: "frog" }, { id: "two", content: "frog" }, { id: "three", content: "fly" }, { id: "four", content: "swamp" }])

    const dialog_box = new NodeRef<typeof DialogBox>()

    function openModal() {
        dialog_box.o!.open()
    }
    
    teleportTo('body',
        <DialogBox ref={dialog_box} />
    )

    return (
        <div>
            {forEachIn($list, (item, $index) => (
                <>
                    <li>{item.content}</li>
                    <p>{$index}</p>
                </>
            ), 'id')}
            <button onclick={openModal}>open</button>
        </div>
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