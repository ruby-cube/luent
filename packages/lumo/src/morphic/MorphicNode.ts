import { Component, ComponentSetup } from "../component/InternalComponent";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { RenderFunction } from "../node/makeNode";

export function MorphicComponent(switchMap: { [key: string]: RenderFunction }) {
    return function $MorphicNode({ as: initialKey }: {
        as: string
    }) {

        const render = () => {
            const dynamicNode = makeDynamicNode(false)
            dynamicNode.activate(switchMap[initialKey])
            //TODO: set up dynamic node properly
        }

        return Component(
            render(),
            {
                setTo(key: string) {
                    // schedule onRender()
                }
            }
        )
    }
}