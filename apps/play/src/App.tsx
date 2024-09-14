import { $Node, COMPONENT, ComponentSetup, create_if, else_create, iterate_over, mx, teleportTo, useEventListener } from "@rue/lumo";
import { useRandomColorGenerator } from "@rue/utils";
import { __addDevName, $Signal, o$$ } from "@rue/muonic";
import { $ } from "@rue/muonic";
import { lazyLoadComponent } from "../../../packages/lumo/src/component/loadComponent";


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

// shallow reactive model o$
// deep reactive model o$$$
// shallow signal $ (also derived signal)
// deep signal $$$
// memo$()

export function App() {
    return mx(
        <List></List>
    )
}

export function List() {

    const $active = $Signal(true)
    if (__DEV__) __addDevName($active, '$active')

    const $list = $Signal(o$$([
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
        $list.setFrom(list => {
            const newList = [...list];
            newList.splice(index, 0, {
                id: genId(),
                content: (Math.random() * 100).toString(),
            });
            return newList;
        })
    }

    function removeItem(index: number) {
        $list.setFrom(list => {
            const _list = [...list]
            _list.splice(index, 1);
            return _list
        })
    }

    const { openModal } = useModal();

    const $showSideBlock = $Signal(false)

    function showSideBlock() {
        $showSideBlock.setTo(true)
    }

    return mx(
        <div>
            <>
                {create_if($(() => $list().length === 0), () => (
                    <div
                        onclick={() => insertItem(0)}
                        style="background-color: gray; cursor: pointer"
                    >
                        insert
                    </div>
                ))}
                {else_create(() =>
                    iterate_over($list, (item$, $index) => (
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
                    ), 'id')
                )}
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
    const $dialogBox = $Node<typeof DialogBox>()

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

function DialogBox() {
    const $open = $Signal(false)
    __addDevName($open, '$open')

    function open() {
        $open.setTo(true)
    }

    function close() {
        $open.setTo(false)
    }

    return mx(
        {
            open,
            close
        },

        <dialog style="background-color: gray" open={$open}>
            Stop
            <button onclick={close}>close</button>
        </dialog>
    )
}