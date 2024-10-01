import { NodeIon, Component, COMPONENT, ComponentSetup, If, Else, For,  Provide, teleportTo, useEventListener } from "@rue/lumo";
import { useRandomColorGenerator } from "@rue/utils";
import { __addDevName, Ion, ionize } from "../../../packages/quarky/src";
import { $ } from "../../../packages/quarky/src";
import { lazyLoadComponent } from "../../../packages/lumo/src/component/loadComponent";
import { ElseIf } from "../../../packages/lumo/src/conditional/If";
import { AnyObject } from "@rue/types";


const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
    return id++;
}



// const SideBlock = lazyLoadComponent({
//     load: () => {
//         const promise = import('./SideBlock').then(({ SideBlock }) => SideBlock)
//         return new Promise((resolve: (SideBlock: ComponentSetup) => void, reject) => {
//             setTimeout(() => {
//                 promise.then((SideBlock) => {
//                     resolve(SideBlock)
//                 })
//             }, 6000) // simulate network latency
//         })
//     },
//     onIdle: true,
//     Placeholder(props) {
//         return <div>Eep! I'm not ready {props.frog}</div>
//     },
//     // timeout: 5000,
//     ErrorView(props) {
//         return <div>{props.error}</div>
//     },
// });

// const TestBox = lazyLoadComponent({
//     load: () => {
//         const promise = import('./TestBox').then(({ TestBox }) => TestBox)
//         return new Promise((resolve: (SideBlock: ComponentSetup) => void, reject) => {
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
//     ErrorView(props) {
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

    const $active = Ion(true)
    if (__DEV__) __addDevName($active, '$active')

    const $list = Ion(ionize([
        { id: 0, content: "frog" },
        { id: 1, content: "dog" },
        { id: 2, content: "fly" },
        { id: 3, content: "swamp" }
    ]))

    if (__DEV__) __addDevName($list, '$list')

    function changeContent(index: number) {
        const item$ = $list()[index];
        item$.content = 'something else'
    }

    function insertItem(index: number) {
        $list.update(list => {
            const newList = [...list];
            newList.splice(index, 0, {
                id: genId(),
                content: (Math.random() * 100).toString(),
            });
            return newList;
        })
    }

    function removeItem(index: number) {
        $list.update(list => {
            const _list = [...list]
            _list.splice(index, 1);
            return _list
        })
    }

    const { openModal } = useModal();

    const $showSideBlock = Ion(false)

    function showSideBlock() {
        $showSideBlock.set(true)
    }

    const $listLengthIsZero = () => $list().length === 0

    return (
        <div>
            <>
                {If($listLengthIsZero, () => (
                    <div
                        onClick={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                ))}
                {ElseIf($(() => $list().length === 0), () => (
                    <div
                        onClick={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                ))}
                {For($list, (item$, $index) => (
                    <div style={`background-color: ${randomColor.get()}`}>
                        <p
                            onClick={() => removeItem($index())}
                            style="cursor: pointer"
                        >
                            X
                        </p>
                        <li onClick-v={() => changeContent($index())}>
                            {$(() => item$.content)}
                        </li>
                        <p>{$index}</p>
                        <div
                            onClick={() => insertItem($index() + 1)}
                            style="background-color: gray; cursor: pointer"
                        >
                            insert
                        </div>
                    </div>
                ), 'id')}
            </>
            <button onClick={openModal}>open</button>
            {/* <>
                {If($showSideBlock, 'create', () =>
                    <>
                        <TestBox />
                        <SideBlock frog="sir robin" />
                    </>
                )}
            </> */}
            <button onClick={showSideBlock}>show Side Block</button>
        </div>
    )
}



function useModal() {
    const $dialogBox = NodeIon(DialogBox)

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
    },
    provide: Provide
) {
    const $active = Ion(true)
    const $ready = Ion(true)

    const exposed = {
        $active,
        $ready
    }

    return Component(
        <>
            {If($active, () => ((dialogBox) => (
                <>
                    <DialogBox model={dialogBox}></DialogBox>
                    <button onClick={dialogBox.open}>open</button>
                </>
            ))(useDialogBox({ initialState: 'open' })))} // state must be created within render function
            {ElseIf($ready, () =>
                <button>click</button>
            )}
            {ElseIf($active, () => {
                const $dialogBox = fromContext(ALERT_DIALOG_BOX) || NodeIon()

                return (
                    <Wrapper title={() => $dialogBox().title}>
                        {() => (
                            <div>
                                <DialogBox ref={$dialogBox} />
                                <button onClick={() => $dialogBox().open}>open</button>
                            </div>)
                        }
                    </Wrapper>
                )
            })}
        </>,
        exposed
    )
}

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
                <button onClick={close} ref={$button}>close</button>
            </dialog>
        )),
        {
            $open,
            open
        }
    )
}

function useDialogBox(config: { initialState: 'open' | 'closed' }) {
    const $open = Ion(false)
    __addDevName($open, '$open')

    function open() {
        $open.set(true)
    }

    function close() {
        $open.set(false)
    }

    return {
        title: "DialogBox",
        $open,
        open,
        close,
    }
}



