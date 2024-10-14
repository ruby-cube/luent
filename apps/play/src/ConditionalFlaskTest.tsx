import { Else, ElseIf, If } from "@rue/lumo"
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
        $pending.set(false)
    }, 500)

    return (
        <>
            {If($pending, 'create', () => <div>loading...</div>)}
            {Else(() => <div>Main componentA</div>)}
        </>
    )
}

function ComponentB() {
    const $pending = ion(true);
    const $error = ion(false);

    setTimeout(() => {
        $pending.set(false)
    }, 5000)

    return (
        <>
            {If($pending, 'create', () => <div>loadingB...</div>)}
            {ElseIf($error, () => <div>errorB</div>)}
            {Else(() => <div>Main componentB</div>)}
        </>
    )
}