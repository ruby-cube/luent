import { Component, NodeIon } from "@rue/lumo";
import { MorphicComponent } from "../../../packages/lumo/src/morphic/MorphicComponent";

export function TestMorphic() {

    const $Morphable = MorphicComponent({
        hi: () =>
            <div>hello</div>
        ,
        bye: () =>
            <div>bye</div>
    })

    const $morphicNode = NodeIon($Morphable)
    const $comment = NodeIon(CommentBlock)

    function morph(key: string) {
        // console.log("$morphic node", $morphicNode)
        $morphicNode()!.render(key)
    }

    return Component(
        <>
            <$Morphable as='hi' ref={$morphicNode}></$Morphable>
            <button onClick={() => morph('hi')}>change to hi</button>
            <button onClick={() => morph('bye')}>change to bye</button>
        </>
    )
}

function CommentBlock(setup: {
    blue: string
}) {
    return Component({
        frog: true
    },
        <div>blah</div>
    )
}  