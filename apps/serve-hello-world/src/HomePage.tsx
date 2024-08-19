//@ts-nocheck
import { html } from "../../../packages/literate/src/Literate.js";

export function HomePage() {

    return {
        title: 'Home',
        render: html`
            <h3>Home</h3>
            <div>Home sweet home</div>
        `
    }
}

export function HomePage() {

    return [
        expose({
            title: 'Home'
        }),
        html`
            <h3>Home</h3>
            <div>Home sweet home</div>
        `
    ]
}