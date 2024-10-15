import { ion } from "../../../packages/quarky/src"

export function ChildOne() {

    const $value = ion('hi')
    function updateValue(newValue: string) {
        $value.as(newValue)
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
            oninput="()=>emit('update:modelValue', $event.target.value)"
        />
    )
}