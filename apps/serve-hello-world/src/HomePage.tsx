
// export function HomePage() {

import { html } from "@rue/literate";
import { component, expose } from "@rue/lumo";

//     return {
//         title: 'Home',
//         render: html`
//             <h3>Home</h3>
//             <div>Home sweet home</div>
//         `
//     }
// }

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

