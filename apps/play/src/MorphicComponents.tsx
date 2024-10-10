//@ts-nocheck
import { Ion, Ion } from "../../../packages/quarky/src"
import { watchForRender } from "../../../packages/lumo/src/watch/watchAndPreserve";
import { NodeRef } from "@rue/lumo";

export function MainBlock() {

    const $hello = $PortableNode() as unknown as Ion<PortableNode>
    const $bye = $PortableNode() as unknown as Ion<PortableNode>

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
        $main_content.set($bye)
        $main_content.set($recordsNodes, 9)
    }



    const $mainContent = NodeRef($MainContent)

    const $MainContent = MorphicNode({
        hello: () =>
            <div>hellow</div>
        ,
        bye: () =>
            <div>bey</div>
    })

    $mainContent.render('bye')

    return (
        <main>
            <$MainContent as='hello' ref={$mainContent}  />
            <$records_list />
            <button onclick={changeMainContent}>click</button>
        </main>
    )
}

function $portable(render: (() => any) | Ion<PortableNode>, $ref: Ion<PortableNode> | (() => any)) {
    return render;
}

function $MorphicNode() {

}

function $MorphicPort(initialKey: string | Ion<any>, switchMap: { [key: string]: () => any } | any[]): { (): any; set: (key: string) => any } {

    const $key = Ion(initialKey)
    const $render = Ion(switchMap[$key()])

    watch($key, (key) => {
        $render.update(switchMap[key])
    })

    function $Morphable() {
        return $morphling($render)
    }

    $Morphable.set = $key.set

    return $Morphable as unknown as { (): any; set: (key: string) => any }
}

function MainContent() {

    const $mainContent = DerivedIon(() =>
        <div>hello</div>)

    function changeMainContent() {
        $mainContent.set(() =>
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

function $morphling($render: Ion<() => any>) {
    return new MorphlingKit($render)
}

class MorphlingKit {
    constructor(public $render: Ion<() => any>) { }
}

function setUpMorphling(morphlingKit: MorphlingKit) {
    const $render = morphlingKit.$render
    watch($render, (render) => {
        const output = render()
    }, { phase: Phase.RENDER })
}