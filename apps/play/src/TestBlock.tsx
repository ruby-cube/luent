import {  NodeRef } from "@rue/lumo";
import { ion, ion } from "../../../packages/quarky/src";


export function TestBlockA(props: { $active: AtomicIon<boolean> }) {
    const { $active } = props
    const $black = ion(true);

    expose({
        dog: "hi"
    })
    
    return $if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))
}

function Lap(){
    const $testBlock = NodeRef(TestBlockA)
    const $active = ion(false)

    onMounted(()=>{
        const hey = $testBlock()
    })

    return (
        <div>fkj
        <TestBlockA $active={$active}></TestBlockA>
        </div>
    )
}


export function TestBlockB(props: { $active: AtomicIon<boolean> }) {
    const { $active } = props
    const $black = ion(true);

    return (
        <>
            {$if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))}
        </>
    )
}
