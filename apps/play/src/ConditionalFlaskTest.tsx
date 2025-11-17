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
    const $pending = Ion(true);

    setTimeout(() => {
        $pending.value = false
    }, 500)

    return (
        <>
            {If($pending, 'create', () => <div>loading...</div>)}
            {Else(() => <div>Main componentA</div>)}
        </>
    )
}

function ComponentB() {
    const $pending = Ion(true);
    const $error = Ion(false);

    setTimeout(() => {
        $pending.value = false
    }, 5000)

    return (
        <>
            {If($pending, 'create', () => <div>loadingB...</div>)}
            {ElseIf($error, () => <div>errorB</div>)}
            {Else(() => <div>Main componentB</div>)}
        </>
    )
}