import { ion } from "../../../packages/quarky/src"

export function ChildOne() {

    const vvvalue = ion('hi')
    function updateValue(newValue: string) {
        vvvalue.state = newValue
    }

    return (
        <input
            bind-value={vvvalue}
        />
    )
}

export function ChildTwo() {

    const vvvalue = ion('hi')

    return (
        <input value="props.modelValue"
            on:input={()=>emit('update:modelValue', $event.target.value)}
        />
    )
}