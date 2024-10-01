//@ts-nocheck

//Static Components
//Reactive Components
//Async Components
//Lazy Compoments

export async function MainSite(
    props: {
        Slot: () => MaybePromise<SSRComponent<{ title: string }>>
    }
) {

    const page = new NodeRef();

    return html`
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${() => page.o.title}</title>
        </head>
        
        <body>
            ${mO(NavBar)} ${mO(Slot, { ref: page })}
        </body>
        
        </html>
    `
}

function NavBar() {
    return html`
        <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/blog">Blog</a>
        </nav>
    `
}

function ReactiveBlock() {
    const $active = toSignal(true);
    function toggleActive() {
        $active.update(active => !active)
    }

    const $count = toSignal(0);

    return html` // jsx-ish
        <div>
            <>
                ${If($active, () => html`
                    <p>I'm Active</p>
                ` )} 
                ${Else(() => html`
                    <p>I'm Not Active</p>
                ` )}
            </>
            <button onClick={toggleActive}>click</button>
            <p>${$count}</p>
            <ListBlock>
                ${() => html`<li>hi</li>`}
            </ListBlock>
        </div>
    `
}

function ReactiveBlockCompiled() {
    const $active = toSignal(true);
    const $count = toSignal(0);

    return html`
        <div>
            ${$active() ? html`
                <p>I'm Active</p>
            ` : html`
                <p>I'm Not Active</p>
            `}
            <button>click</button>
            <p>${$count()}</p>
            ${mO(ListBlock, {}, () => html`<li>hi<li>`)}
        </div>
    `
}