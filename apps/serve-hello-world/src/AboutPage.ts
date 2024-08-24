import { AnyObject } from "@rue/types";
import { html } from "../../../packages/literate/src/Literate.js";
import { expose } from "@rue/lumo";

export function AboutPage() {
    return [
        expose({
            title: 'About'
        }),
        html`
            <h3>About</h3>
            <div>About Me: Lorem Ipsum</div>
        `
    ]
}

