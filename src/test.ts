import { $lifetime } from "../packages/flask/flaskedListeners";
import { useSignalize } from "../packages/muonic/useSignalize";
import { watch } from "../packages/muonic/watch";

const button = document.createElement('button');
button.append("click me")


export function manipulateDOM(element: HTMLElement) {
    element.append("dog house")

    element.append(button)
}

const { signalize, set } = useSignalize();

const $frog = signalize({
    name: "kermit"
})


watch($frog, (newVal, oldVal) => {
    console.log("newVal", newVal)
    console.log("old", oldVal)
}, { $lifetime })

console.log($frog())

button.addEventListener('click', () => {
    set($frog, o => ({ name: "robin" }))
})