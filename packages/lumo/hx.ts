import { Observable } from "../muonic/ObservableCapsule";

type Signal<T> = () => T
type ElementConfig = {
    class?: string | { [key: string]: () => boolean };
    // nodes?: { for: (item: any) => (() => void), in: Signal<any> | [Observable<{}>, ...string[]] }[]
    nodes?: ((() => void) | For<any>)[]
    text?: string | (() => void)
    key?: string | number
    ref?: string
}
type For<T> = {
    for: (item: T, i: number) => (() => void),
    of: [Observable<T>, ... string[]] | Signal<T>
}

function hx(tagName: string, config: ElementConfig) {
    return () => {

    }
}

const $items = () => { return { text: "" } }

function List() {



    return {
        render: () =>
            hx('div', {
                class: 'list',
                nodes: [
                    hxsForItem($items, 'p'),
                    hx('button', { text: "add" })
                ]
            }),

        style: {

        }
    }
}



function hxsForItem($items: () => any, p: `p`): For<{ text: string }> {
    return {
        for: (item, i) =>
            hx(p, {
                text: item.text,
                key: i,
                ref: "item"
            }),
        of: $items
    }
}


function hxIf($isActive: () => boolean,)

// return () =>
//     hx('div', {
//         class: "counter",
//         style: { color() { counter.visible ? 'red' : 'blue' } },
//         on: { click: toggleColor },
//         nodes: [
//             hx('button', { text: "increment" }),
//             hx('button', { text: "decrement" }),
//         ]
//     })