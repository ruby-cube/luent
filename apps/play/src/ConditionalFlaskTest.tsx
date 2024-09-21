import { $else, $elseIf, $if } from "@rue/lumo"
import { $State } from "@rue/muonic"

export function ConditionalFlaskTest() {
    return (
        <div>
            <ComponentA />
            <ComponentB />
        </div>
    )
}

function ComponentA() {
    const $pending = $State(true);

    setTimeout(() => {
        $pending.setTo(false)
    }, 500)

    return (
        <>
            {$if($pending, 'create', () => <div>loading...</div>)}
            {$else(() => <div>Main componentA</div>)}
        </>
    )
}

function ComponentB() {
    const $pending = $State(true);
    const $error = $State(false);

    setTimeout(() => {
        $pending.setTo(false)
    }, 5000)

    return (
        <>
            {$if($pending, 'create', () => <div>loadingB...</div>)}
            {$elseIf($error, () => <div>errorB</div>)}
            {$else(() => <div>Main componentB</div>)}
        </>
    )
}