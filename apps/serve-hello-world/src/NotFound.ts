import { html } from "./lumin.js";

export function NotFound(){
    return {
        title: '404 Not Found',
        render: html`
            <p>404 Not Found :(</p>
        `
    }
}