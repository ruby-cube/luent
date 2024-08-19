import { html } from "../../../packages/literate/src/Literate.js";

export function NotFound(){
    return {
        title: '404 Not Found',
        render: html`
            <p>404 Not Found :(</p>
        `
    }
}