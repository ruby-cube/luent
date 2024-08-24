import { html, Literate, mO, SSRComponent, SSRComponentSetup } from "@rue/literate";
import { $Node, ComponentSetup, InternalComponent, PublicComponent } from "@rue/lumo";
import { Signal } from "@rue/muonic";

export function MainSite({
    Slot
}: {
    Slot: () => [PublicComponent & {title: string}, Literate] 
}) {
    const $page = $Node<() => SSRComponent<{ title: string }>>() as unknown as Signal<{ title: string }>;

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
//                     $if($loading, 'loading'),
//                     $else($data)
//                 ])}
//             </p>
//         </nav>
//     `
// }

function cases(a: any) {

}

