import { $elseIf, $if, expose, NodeRef, onMounted } from "@rue/lumo";
import { Signal, toSignal } from "@rue/muonic";


export function TestBlockA(props: { $active: Signal<boolean> }) {
    const { $active } = props
    const $black = toSignal(true);

    expose({
        dog: "hi"
    })
    
    return $if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))
}

function Lap(){
    const testBlock = new NodeRef<typeof TestBlockA>()
    const $active = toSignal(false)

    onMounted(()=>{
        const hey = testBlock.o
    })

    return (
        <div>fkj
        <TestBlockA $active={$active}></TestBlockA>
        </div>
    )
}


export function TestBlockB(props: { $active: Signal<boolean> }) {
    const { $active } = props
    const $black = toSignal(true);

    return (
        <>
            {$if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))}
        </>
    )
}
