import { $else, $elseif, $if } from "@rue/lumo"
import { ion } from "../../../packages/quarky/src"

export function ConditionalFlaskTest() {
    return (
        <div>
            <ComponentA />
            <ComponentB />
        </div>
    )
}

function ComponentA() {
    const $pending = ion(true);

    setTimeout(() => {
        $pending.state = false
    }, 500)

    return (
        <>
            {$if($pending, 'create', () => <div>loading...</div>)}
            {$else(() => <div>Main componentA</div>)}
        </>
    )
}

function ComponentB() {
    const $pending = ion(true);
    const $error = ion(false);

    setTimeout(() => {
        $pending.state = false
    }, 5000)

    return (
        <>
            {$if($pending, 'create', () => <div>loadingB...</div>)}
            {$elseif($error, () => <div>errorB</div>)}
            {$else(() => <div>Main componentB</div>)}
        </>
    )
}