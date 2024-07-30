import { $if } from "@rue/lumo";
import { Signal } from "@rue/muonic";

export function TestBlock(props: { $active: Signal<boolean> }) {
    const { $active } = props
    return (
        <>
            {$if($active, 'create', () => (
                <div>TestBlock!!</div>
            ))}
        </>
    )
}