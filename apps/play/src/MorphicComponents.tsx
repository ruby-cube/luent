//@ts-nocheck
import { Ion, AtomicIon, watch } from "@rue/muonic"
import { watchForRender } from "../../../packages/lumo/src/watch/watchAndPreserve";
import { $Node } from "@rue/lumo";

export function MainBlock() {

    const $hello = $PortableNode() as unknown as AtomicIon<PortableNode>
    const $bye = $PortableNode() as unknown as AtomicIon<PortableNode>

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

    const $list = Ion(['ho'])

    const $records_list = $ListPort($records, (record) => (
        <h1>{record.content}</h1>
    ), { ref: $recordNodes, IDKey: 'id' })

    function changeMainContent(index) {
        $main_content.setTo($bye)
        $main_content.setTo($recordsNodes, 9)
    }



    const $mainContent = NodeIon($MainContent)

    const $MainContent = MorphicNode({
        hello: () =>
            <div>hellow</div>
        ,
        bye: () =>
            <div>bey</div>
    })

    $mainContent.setTo('bye')

    return (
        <main>
            <$MainContent as='hello' ref={$mainContent} />
            <$records_list />
            <button onclick={changeMainContent}>click</button>
        </main>
    )
}

function $portable(render: (() => any) | AtomicIon<PortableNode>, $ref: AtomicIon<PortableNode> | (() => any)) {
    return render;
}

function $MorphicNode() {

}

function $MorphicPort(initialKey: string | AtomicIon<any>, switchMap: { [key: string]: () => any } | any[]): { (): any; setTo: (key: string) => any } {

    const $key = Ion(initialKey)
    const $render = Ion(switchMap[$key()])

    watch($key, (key) => {
        $render.update(switchMap[key])
    })

    function $Morphable() {
        return $morphling($render)
    }

    $Morphable.setTo = $key.set

    return $Morphable as unknown as { (): any; setTo: (key: string) => any }
}

function MainContent() {

    const $mainContent = Ion(() =>
        <div>hello</div>)

    function changeMainContent() {
        $mainContent.setTo(() =>
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

function $morphling($render: AtomicIon<() => any>) {
    return new MorphlingKit($render)
}

class MorphlingKit {
    constructor(public $render: AtomicIon<() => any>) { }
}

function setUpMorphling(morphlingKit: MorphlingKit) {
    const $render = morphlingKit.$render
    watch($render, (render) => {
        const output = render()
    }, { phase: Phase.RENDER })
}