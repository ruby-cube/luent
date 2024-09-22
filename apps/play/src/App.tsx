import { $Node, Component, COMPONENT, ComponentSetup, CreateIf, ElseCreate, For,  Provide, teleportTo, useEventListener } from "@rue/lumo";
import { useRandomColorGenerator } from "@rue/utils";
import { __addDevName, Ion, ionize } from "@rue/muonic";
import { $ } from "@rue/muonic";
import { lazyLoadComponent } from "../../../packages/lumo/src/component/loadComponent";
import { ElseCreateIf } from "../../../packages/lumo/src/conditional/CreateIf";
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

const onClick = useEventListener('click');

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
        $showSideBlock.setTo(true)
    }

    const $listLengthIsZero = () => $list().length === 0

    return (
        <div>
            <>
                {CreateIf($listLengthIsZero, () => (
                    <div
                        onclick={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                ))}
                {ElseCreateIf($(() => $list().length === 0), () => (
                    <div
                        onclick={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                ))}
                {For($list, (item$, $index) => (
                    <div style={`background-color: ${randomColor.get()}`}>
                        <p
                            onclick={() => removeItem($index())}
                            style="cursor: pointer"
                        >
                            X
                        </p>
                        <li onclick-v={() => changeContent($index())}>
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
                ), 'id')}
            </>
            <button onclick={openModal}>open</button>
            {/* <>
                {$if($showSideBlock, 'create', () =>
                    <>
                        <TestBox />
                        <SideBlock frog="sir robin" />
                    </>
                )}
            </> */}
            <button onclick={showSideBlock}>show Side Block</button>
        </div>
    )
}



function useModal() {
    const $dialogBox = $Node(DialogBox)

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
            {CreateIf($active, () => ((dialogBox) => (
                <>
                    <DialogBox model={dialogBox}></DialogBox>
                    <button onclick={dialogBox.open}>open</button>
                </>
            ))(useDialogBox({ initialState: 'open' })))} // state must be created within render function
            {ElseCreateIf($ready, () =>
                <button>click</button>
            )}
            {ElseCreateIf($active, () => {
                const $dialogBox = fromContext(ALERT_DIALOG_BOX) || $Node()

                return (
                    <Wrapper title={() => $dialogBox().title}>
                        {() => (
                            <div>
                                <DialogBox ref={$dialogBox} />
                                <button onclick={() => $dialogBox().open}>open</button>
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
                <button onclick={close} ref={$button}>close</button>
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
        $open.setTo(true)
    }

    function close() {
        $open.setTo(false)
    }

    return {
        title: "DialogBox",
        $open,
        open,
        close,
    }
}



