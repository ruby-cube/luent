import { html, Literate, mO, SSRComponent, SSRComponentSetup } from "@rue/literate";
import { NodeIon, ComponentSetup, InternalComponent, PublicComponent } from "@rue/lumo";
import { ReactiveIon } from "../../../packages/quarky/src";

export function MainSite({
    Slot
}: {
    Slot: () => [PublicComponent & {title: string}, Literate] 
}) {
    const $page = NodeIon<() => SSRComponent<{ title: string }>>() as unknown as ReactiveIon<{ title: string }>;

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
//         $data.set(data => result)
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

