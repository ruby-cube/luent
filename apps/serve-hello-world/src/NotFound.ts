import { html } from "@rue/literate";
import { expose } from "@rue/lumo";

export function NotFound(){
    return [
        expose({title: '404 Not Found'}),
        html`
            <p>404 Not Found :(</p>
        `
    ]
}