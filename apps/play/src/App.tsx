//@ts-nocheck
import { Component, NodeRef, template, ComponentTag, If, Else, For, teleportTo } from "@rue/luent";
import { useRandomColorGenerator } from "@rue/utils";
import { __addDevName, Ion, ion, ionize } from "../../../packages/quarky/src";
import { lazyLoadComponent } from "../../../packages/luent/src/component/LazyComponent";
import { ElseIf } from "../../../packages/luent/src/conditional/If";
import { AnyObject } from "@rue/types";


const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
    return id++;
}





// const SideBlock = lazyLoadComponent({
//     load: () => {
//         const promise = import('./SideBlock').then(({ SideBlock }) => SideBlock)
//         return new Promise((resolve: (SideBlock: ComponentTag) => void, reject) => {
//             setTimeout(() => {
//                 promise.then((SideBlock) => {
//                     resolve(SideBlock)
//                 })
//             }, 6000) // simulate network latency
//         })
//     },
//     onIdle: true,
//     // timeout: 5000,
// });

// const TestBox = lazyLoadComponent({
//     load: () => {
//         const promise = import('./TestBox').then(({ TestBox }) => TestBox)
//         return new Promise((resolve: (SideBlock: ComponentTag) => void, reject) => {
//             setTimeout(() => {
//                 promise.then((SideBlock) => {
//                     resolve(SideBlock)
//                 })
//             }, 2000) // simulate network latency
//         })
//     },
//     onIdle: true,
//     Placeholder(props) {
//         return <div>loading test box...</div>
//     },
//     // timeout: 5000,
//     Error(props) {
//         return <div>{props.error}</div>
//     },
// });


// shallow reactive model ionize
// deep reactive model o$$$
// shallow signal $ (also derived signal)
// deep signal $$$
// memo$()

export function App() {

    return (
        <List></List>
    )
}

export function List() {

    const $active = ion(true)
    if ( __DEV__) __addDevName($active, '$active')

    const $list = ion(ionize([
        { id: 0, content: "frog" },
        { id: 1, content: "dog" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ]))

    if ( __DEV__) __addDevName($list, '$list')

    function changeContent(index: number) {
        const item$ = $list()[index];
        item$.content = 'something else'
    }

    function insertItem(index: number) {
        const newList = [...$list()];
        newList.splice(index, 0, {
            id: genId(),
            content: (Math.random() * 100).toString(),
        });
        $list.value = newList
    }

    function removeItem(index: number) {
        const _list = [...$list()]
        _list.splice(index, 1);
        $list.value = _list
    }

    const { openModal } = useModal();

    const $showSideBlock = ion(false)

    function showSideBlock() {
        $showSideBlock.value = true
    }

    const $listLengthIsZero = () => $list().length === 0

    return Component({
        as: {
            $listLengthIsZero
        },
        nodes:
            <div>
                {If($listLengthIsZero, 'show',

                    <div
                        on:click={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>

                ).ElseIf(() => $list().length === 0,

                    <div
                        on:click={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                )}

                {For($list, (item$, $index) =>
                    <div style={`background-color: ${randomColor.get()}`}>
                        <p
                            on:click={() => removeItem($index())}
                            style="cursor: pointer"
                        >
                            X
                        </p>
                        <li on:click-v={() => changeContent($index())}>
                            {$(() => item$.content)}
                        </li>
                        <p>{$index}</p>
                        <div
                            on:click={() => insertItem($index() + 1)}
                            style="background-color: gray; cursor: pointer"
                        >
                            insert
                        </div>
                    </div>
                    , 'id')}
                <button on:click={openModal}>open</button>
                {/* <>
                {If($showSideBlock, 'create', () =>
                    <>
                        <TestBox />
                        <SideBlock frog="sir robin" />
                    </>
                )}
            </> */}
                <button on:click={showSideBlock}>show Side Block</button>
            </div>
    }
    )
}



function useModal() {
    const $dialogBox = NodeRef(DialogBox)

    function openModal() {
        $dialogBox()!.open()
    }

    teleportTo('body',
        <DialogBox ref={$dialogBox} />
    )

    return {
        openModal
    }
}



function Glo() {
    return (
        <Appo kdj="kjk"></Appo>
    )
}

function Appo(
    setup: {
        kdj: string
    }
) {
    const $active = ion(true)
    const $ready = ion(true)

    const exposed = {
        $active,
        $ready
    }

    return Component(
        <>
            {If($active, () => ((dialogBox) => (
                <>
                    <DialogBox model={dialogBox}></DialogBox>
                    <button on:click={dialogBox.open}>open</button>
                </>
            ))(useDialogBox({ initialState: 'open' })))} // state must be created within render function
            {ElseIf($ready, () =>
                <button>click</button>
            )}
            {ElseIf($active, () => {
                const $dialogBox = fromContext(ALERT_DIALOG_BOX) || NodeRef()

                return (
                    <Wrapper title={() => $dialogBox().title}>
                        {() => (
                            <div>
                                <DialogBox ref={$dialogBox} />
                                <button on:click={() => $dialogBox().open}>open</button>
                            </div>)
                        }
                    </Wrapper>
                )
            })}
        </>,
        exposed
    )
}

<div>
    {If(open, [
        morphs.with(fade),
        If(entering,
            <p>Hi</p>
        ),
        Else(
            <p>Bye</p>
        )
    ])}
</div>

function Wrapper({ title, Slot }: {
    title: string,
    Slot: () => any
}) {

    return (
        <>
            <h1>title</h1>
            <PageHeader />
            <Slot />
        </>
    )
}

function PageHeader() {

}



type DialogBoxState = ReturnType<typeof useDialogBox>

function DialogBox({
    model: { $open, close },
    $button
}: {
    model: DialogBoxState
    $button?: NodeRef
}) {

    return Component(
        teleportTo('body', (
            <dialog style="background-color: gray" open={$open}>
                Stop
                <button on:click={close} ref={$button}>close</button>
            </dialog>
        ))).expose({
            $open,
            open
        })
}

function useDialogBox(config: { initialState: 'open' | 'closed' }) {
    const $open = ion(false)
    __addDevName($open, '$open')

    function open() {
        $open.value = true
    }

    function close() {
        $open.value = false
    }

    return {
        title: "DialogBox",
        $open,
        open,
        close,
    }
}



