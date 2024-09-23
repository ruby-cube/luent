import {  $Node } from "@rue/lumo";
import { AtomicIon, Ion } from "../../../packages/quarky/src";


export function TestBlockA(props: { $active: AtomicIon<boolean> }) {
    const { $active } = props
    const $black = Ion(true);

    expose({
        dog: "hi"
    })
    
    return $if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))
}

function Lap(){
    const $testBlock = $Node(TestBlockA)
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


export function TestBlockB(props: { $active: AtomicIon<boolean> }) {
    const { $active } = props
    const $black = Ion(true);

    return (
        <>
            {$if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))}
        </>
    )
}
