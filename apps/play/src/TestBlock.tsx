import { $elseIf, $if, $Node } from "@rue/lumo";
import { Signal, $Signal } from "@rue/muonic";


export function TestBlockA(props: { $active: Signal<boolean> }) {
    const { $active } = props
    const $black = $Signal(true);

    expose({
        dog: "hi"
    })
    
    return $if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))
}

function Lap(){
    const $testBlock = $Node<typeof TestBlockA>()
    const $active = $Signal(false)

    onMounted(()=>{
        const hey = $testBlock()
    })

    return (
        <div>fkj
        <TestBlockA $active={$active}></TestBlockA>
        </div>
    )
}


export function TestBlockB(props: { $active: Signal<boolean> }) {
    const { $active } = props
    const $black = $Signal(true);

    return (
        <>
            {$if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))}
        </>
    )
}
