import { $elseIf, $if } from "@rue/lumo";
import { Signal, useSignalize } from "@rue/muonic";

const { $, set } = useSignalize()

export function TestBlockA(props: { $active: Signal<boolean> }) {
    const { $active } = props
    const $black = $(true);
    return $if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))
}
export function TestBlockB(props: { $active: Signal<boolean> }) {
    const { $active } = props
    const $black = $(true);

    return (
        <>
            {$if($active, 'create', () => (
                <div>TestBlockA!!</div>
            ))}
        </>
    )
}
