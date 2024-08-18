import { $Node } from "@rue/lumo";
import { html, SSRComponent } from "./lumin.js";
import { mO } from "./makeComponent.js";

export function MainSite(props: {
    Slotted: { Page: () => SSRComponent<{ title: string }> }
}) {
    const {Slotted} = props

    const $page = $Node();

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
            ${mO(Slotted.Page, { ref: $page })}
            <!-- <div class=${['list-block', (o) => { if ($active()) o.add('active') }]}>hi</div> -->
        </body>
        
        </html>
    `
}


function AboutPage(){
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

