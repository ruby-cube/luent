import { ion } from "../../../packages/quarky/src"

export function ChildOne() {

    const $value = ion('hi')
    function updateValue(newValue: string) {
        $value.state = newValue
    }

    return (
        <input
            bind-value={$value}
        />
    )
}

export function ChildTwo() {

    const $value = ion('hi')

    return (
        <input value="props.modelValue"
            on:input={()=>emit('update:modelValue', $event.target.value)}
        />
    )
}