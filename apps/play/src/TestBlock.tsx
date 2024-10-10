import {  NodeRef } from "@rue/lumo";
import { Ion, Ion } from "../../../packages/quarky/src";


export function TestBlockA(props: { $active: Ion<boolean> }) {
    const { $active } = props
    const $black = Ion(true);

    expose({
        dog: "hi"
    })
    
    return If($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))
}

function Lap(){
    const $testBlock = NodeRef(TestBlockA)
    const $active = Ion(false)

    onMounted(()=>{
        const hey = $testBlock()
    })

    return (
        <div>fkj
        <TestBlockA $active={$active}></TestBlockA>
        </div>
    )
}


export function TestBlockB(props: { $active: Ion<boolean> }) {
    const { $active } = props
    const $black = Ion(true);

    return (
        <>
            {If($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))}
        </>
    )
}
