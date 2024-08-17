import { fromEntries, html } from "../../../../packages/literate"

const list = [
    {
        content: 'fish'
    },
    {
        content: 'dog'
    },
    {
        content: 'frog'
    },
    {
        content: 'horse'
    },
]

export function List() {
    return {
        render: html`
        <ul>
            ${fromEntries(list, (item) => ListItem(item.content).render())}
        </ul>
    `}
}

function ListItem(text: string) {
    return {
        render: html`
        <li>${text}</li>
        <button>click</button>
    `}
}


