//@ts-nocheck
import { $Signal, Signal, watch } from "@rue/muonic"
import { watchForRender } from "../../../packages/lumo/src/watch/watchForRender";
import { $Node } from "@rue/lumo";

export function MainBlock() {

    const $hello = $PortableNode() as unknown as Signal<PortableNode>
    const $bye = $PortableNode() as unknown as Signal<PortableNode>

    const helloView = $hello()
    helloView.remove()
    helloView.moveTo($MainContent)
    helloView.moveTo()

    const $main_content = $MorphicPort([
        [$hello, () =>
            <div>hello</div>
        ],
        [$bye, () =>
            <div>bye</div>
        ]
    ], $hello) // if using directly in template

    const $list = $Signal(['ho'])

    const $records_list = $ListPort($records, (record) => (
        <h1>{record.content}</h1>
    ), { ref: $recordNodes, IDKey: 'id' })

    function changeMainContent(index) {
        $main_content.setTo($bye)
        $main_content.setTo($recordsNodes, 9)
    }

    return (
        <main>
            <$main_content as={$hello}/>
            <$records_list />
            <button onclick={changeMainContent}>click</button>
        </main>
    )
}

function $portable(render: (() => any) | Signal<PortableNode>, $ref: Signal<PortableNode> | (() => any)) {
    return render;
}

function $MorphicNode(){
    
}

function $MorphicPort(initialKey: string | Signal<any>, switchMap: { [key: string]: () => any } | any[]): { (): any; setTo: (key: string) => any } {

    const $key = $Signal(initialKey)
    const $render = $Signal(switchMap[$key()])

    watch($key, (key) => {
        $render.set(switchMap[key])
    })

    function $Morphable() {
        return $morphling($render)
    }

    $Morphable.setTo = $key.set

    return $Morphable as unknown as { (): any; setTo: (key: string) => any }
}

function MainContent() {

    const $mainContent = $Signal(() =>
        <div>hello</div>)

    function changeMainContent() {
        $mainContent.set(() => () =>
            <div>bye</div>
        )
    }

    return (
        <>
            {$morphling($mainContent)}
            <button onclick={changeMainContent}>click</button>
        </>
    )
}

function $morphling($render: Signal<() => any>) {
    return new MorphlingKit($render)
}

class MorphlingKit {
    constructor(public $render: Signal<() => any>) { }
}

function setUpMorphling(morphlingKit: MorphlingKit) {
    const $render = morphlingKit.$render
    watchForRender($render, (render) => {
        const output = render()
    })
}