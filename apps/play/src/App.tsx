//@ts-nocheck
import { $else, $elseIf, $if, COMPONENT, Component, ComponentSetup, ConditionalRenderKit, expose, forEachIn, NodeConfig, NodeEntity, NodeRef, onMounted, RenderSlotted, teleportTo, useEventListener } from "@rue/lumo";
import { Signal, useReactivity, watchEffect } from "@rue/muonic"
import { idleLoadComponent, loadComponent } from "../../../packages/lumo/src/loadComponent";
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

    const dialog_box = useNodeRef<typeof DialogBox>()

    teleportTo('body',
        <DialogBox ref={dialog_box} />
    )

    function openModal() {
        dialog_box.o!.open()
    }

    return (
        <div>
            {forEachIn($list, (item, $index) => (
                <>
                    <li>{item.content}</li>
                    <p>{$index}</p>
                </>
            ), 'id')}
            {/* <button onclick={openModal}>open</button> */}
        </div>
    )
}

export function App() {
    const $active = $(false);
    function toggleActive() {
        set($active, state => !state)
    }

    return (
        <>
            <HereBlock $active={$active}></HereBlock>
            <button onclick={toggleActive}>click</button>
        </>
    )
}

const appi = useNodeRef<typeof App>() //TODO: array
const eh = appi.value


export function Appi() {
    const $active = $(false);
    function toggleActive() {
        set($active, state => !state)
    }

    return [
        expose({
            $active,
            toggleActive
        }),
        <>
            <HereBlock $active={$active}></HereBlock>
            <button onclick={toggleActive}>click</button>
        </>
    ]
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
        $if($open, 'show', () => (
            <dialog style="background-color: gray" open>
                Stop
                <button onclick={close}>close</button>
            </dialog>
        ))
    ]
}