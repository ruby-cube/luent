import { Ion } from "@rue/muonic"

export function ChildOne() {

    const $value = Ion('hi')
    function updateValue(newValue: string) {
        $value.setTo(newValue)
    }

    return (
        <input
            bind-value={$value}
        />
    )
}

export function ChildTwo() {

    const $value = Ion('hi')

    return (
        <input value="props.modelValue"
            oninput="()=>emit('update:modelValue', $event.target.value)"
        />
    )
}