import { Component, getAttributes, NodeRef } from "@rue/lumo";
import { v } from "../../../packages/lumo/src/InputTypes";

function App() {
    const $list = NodeRef(List)
    const b = <List cat=''/>
    return Component(
        <>
            <div class='' ref={$list}>hi</div>
            <List cat='' ref={$list} frog=''>{() => { }}</List>
            <List>{() => { }}</List>
        </>
    )
}

function List(
    input = getAttributes({
        cat: v<string>,
        Slot: v<() => any>('?')
    })
) {
    const a = <div/>
    return Component(
        <>
            <div>
                <>
                </>
            </div>
        </>
    )
}