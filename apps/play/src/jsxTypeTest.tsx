import { component, fromTag, NodeRef } from "@rue/lumo";
import { v } from "../../../packages/lumo/src/InputTypes";

function App() {
    const $list = NodeRef(List)
    const b = <List cat='' />
    return component(
        <>
            <div class='' ref={$list}>hi</div>
            <List cat='' ref={$list} frog=''>{() => { }}</List>
            <List><div></div></List>
        </>
    )
}

function List(
    input = fromTag({
        cat: v<string>,
        Slot: v<(() => any) | any>('?')
    })
) {
    const a = <div />
    return component(
        <>
            <div>
                <>
                </>
            </div>
        </>
    )
}