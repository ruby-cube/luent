import { html } from "../../../../packages/literate";
import { List } from "./List";


export function App() {

    return {
        render: html`
        <h1>Little Rue</h1>
        <article>
            Testing out this idea of using template literals to build a website ${List().render()}
        </article>
     `}
}