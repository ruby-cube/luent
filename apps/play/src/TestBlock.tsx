import {  $Node } from "@rue/lumo";
import { AtomicIon, $State } from "@rue/muonic";


export function TestBlockA(props: { $active: AtomicIon<boolean> }) {
    const { $active } = props
    const $black = $State(true);

    expose({
        dog: "hi"
    })
    
    return $if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))
}

function Lap(){
    const $testBlock = $Node(TestBlockA)
    const $active = $State(false)

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
    const $black = $State(true);

    return (
        <>
            {$if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))}
        </>
    )
}
