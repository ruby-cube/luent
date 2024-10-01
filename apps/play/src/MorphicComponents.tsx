//@ts-nocheck
import { Ion, ReactiveIon, watch } from "../../../packages/quarky/src"
import { watchForRender } from "../../../packages/lumo/src/watch/watchAndPreserve";
import { NodeIon } from "@rue/lumo";

export function MainBlock() {

    const $hello = $PortableNode() as unknown as ReactiveIon<PortableNode>
    const $bye = $PortableNode() as unknown as ReactiveIon<PortableNode>

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



    const $mainContent = NodeIon($MainContent)

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
            <$MainContent createAs='hello' ref={$mainContent}  />
            <$records_list />
            <button onClick={changeMainContent}>click</button>
        </main>
    )
}

function $portable(render: (() => any) | ReactiveIon<PortableNode>, $ref: ReactiveIon<PortableNode> | (() => any)) {
    return render;
}

function $MorphicNode() {

}

function $MorphicPort(initialKey: string | ReactiveIon<any>, switchMap: { [key: string]: () => any } | any[]): { (): any; set: (key: string) => any } {

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

    const $mainContent = Ion(() =>
        <div>hello</div>)

    function changeMainContent() {
        $mainContent.set(() =>
            <div>bye</div>
        )
    }

    return (
        <>
            {$morphling($mainContent)}
            <button onClick={changeMainContent}>click</button>
        </>
    )
}

function $morphling($render: ReactiveIon<() => any>) {
    return new MorphlingKit($render)
}

class MorphlingKit {
    constructor(public $render: ReactiveIon<() => any>) { }
}

function setUpMorphling(morphlingKit: MorphlingKit) {
    const $render = morphlingKit.$render
    watch($render, (render) => {
        const output = render()
    }, { phase: Phase.RENDER })
}