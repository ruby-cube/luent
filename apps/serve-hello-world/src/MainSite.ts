import { html, Literate, mO, SSRComponent, SSRComponentSetup } from "@rue/literate";
import { NodeRef, ComponentSetup, InternalComponent, PublicComponent } from "@rue/lumo";
import { Ion } from "../../../packages/quarky/src";

export function MainSite({
    Slot
}: {
    Slot: () => [PublicComponent & {title: string}, Literate] 
}) {
    const $page = NodeRef<() => SSRComponent<{ title: string }>>() as unknown as Ion<{ title: string }>;

    return html`
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${() => $page().title}</title>
        </head>
        
        <body>
            <nav>
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/blog">Blog</a>
            </nav>
            ${mO(Slot, { ref: $page })}
        </body>
        
        </html>
    `
}


function AboutPage() {
    return
}



// function ListBlock() {

//     const $data = toSignal();

//     const awaitingData = fetch('/lkjkj')
//     awaitingData.then((result) => {
//         $data.as(data => result)
//     })

//     return html`
//         <nav>
//             <a href="/">Home</a>
//             <a href="/about">About</a>
//             <a href="/blog">Blog</a>
//             <p>
//                 ${cases([
//                     If($loading, 'loading'),
//                     Else($data)
//                 ])}
//             </p>
//         </nav>
//     `
// }

function cases(a: any) {

}

