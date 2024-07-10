//@ts-nocheck
import { AnyObject } from "@rue/types";
import { Observable, o$ } from "../muonic/ObservableCapsule";
import { $ } from "../signals";
import { DOMNode } from "./component";
import { ListRenderKit } from "./mx";

type Signal<T> = () => T

type ListRenderKit<T> = {
    render: () => DOMNode[],
    $data: Signal<T>
}

type Slot = () => Nodes<any> | undefined

const $items = () => { return { text: "" } }

const _DIV = "div"
const _P = "p"
const _BUTTON = "button"
const _H1 = "h1"

function List() {



    return {
        render: () => [
            mx("h1", { nodes: [mxB('Shopping'), 'at the mall'] }),
            mx("div", {
                class: 'list',
                nodes: [
                    mxIf($active, {
                        then: renderListBlock({
                            text: 'I sad'
                        }),
                        elseIf: [$loading, renderLoadingBlock({
                            text: 'I loading'
                        })],
                        else: renderPlaceholder({
                            text: 'help me'
                        })
                    }),
                    mxListBlockIf($active, {
                        stuff: 0
                    }),
                    mxsFor((item, i) => m('p', {
                        props: {
                            $dog
                        },
                        text: item.text,
                        key: i,
                        ref: "item"
                    }), $items),
                    mx("button", { text: 'add' }),
                    mxO(ListItem, {
                        props: {
                            $dog,
                            $position,
                            slot,
                            startCount,
                            $color,
                            $item,
                            reItemClicked
                        }
                    })
                ]
            })
        ]
        ,

        style: {

        }
    }
}

function mxBold(text: string) {
    return mx('b', { nodes: [...text] })
}




function mxsForItem(p: `p`, $items: () => any): ListRenderKit<{ text: string }> {
    return forEach((item, i) =>
        mx(p, {
            text: item.text,
            key: i,
            ref: "item"
        }), $items)
}

function renderListBlock(config: Parameters<typeof mO>[1]) {
    return () => mO(ListBlock, config)
}

function renderP(config: any) {
    return () => m('p', config)
}


function ListBlock(props: {
    list: string[],
    bark: boolean
}) {

    const $dog = $(["helps"])

    const frame$ = o$({
        width: 0,
        height: 0,
        center: {
            x: 0,
            y: 0
        }
    })

    const reItemClicked = (obj: { frog: boolean }) => {

    }

    /* 
    <ListItem> 
        <p> 
            <li>hello</li>
            <li> hello</li>
        </p>
    </ListItem>
    */

    return {
        render: () =>
            mx(ListItem, {
                props: {
                    $dog: $dog,
                    $position: $(() => frame$.center),
                    startCount: 0,
                    reItemClicked,
                },
                heading: slot((props) => [
                    mx('p', {
                        nodes: [
                            mx('li', { text: "hello" }),
                            mx('li', { text: "dolly" })
                        ]
                    })
                ]),
                counter: slot((props) =>
                    mx('p', {
                        nodes: [
                            mx('li', { text: "hello" }),
                            mx('li', { text: "dolly" })
                        ]
                    }))
            }),

        provide(): Needs<typeof this> {
            return {
                robin: 9
            }
        },


        critical: css`
            .list-item {
                background-color: blue;
                color: red;
                width: 2px;
            }
        `,

        global: css`
            .list-item {
                background-color: blue;
                color: red;
                width: 2px;
            }
        `,
    }
}

function slot() {

}



type Needs<T> = T extends { render: infer RENDER } ? RENDER extends (arg: any) => infer R ? R extends { context: infer C } ? C : never : never : never
// type Component<T = any> = { render: () => Nodes<any>, provides?: Provides<T> }
// type Provides<T> = T extends (arg: any) => infer R ? R extends { render: infer C } ? C extends () => infer Q ? Q extends { context: infer X } ? X : never : never : never : never
// { [K in keyof C]: C[K] } : never : never : never : never

function getContext<T extends AnyObject>(keys: (keyof T)[]) {
    return {} as unknown as T;
}

// type Context<T, C extends ComponentSetup<any>> = C extends (arg: any) => infer R ? R extends { provides: infer O } ? T & Omit<InheritedContext<C>, keyof O> : T : T
// type InheritedContext<C extends ComponentSetup<any>> = { folly: number };

// type ListItemContext = {
//     sir?: string;
//     robin?: number;
//     theBrave?: boolean;
// }

// TODO: Is props an observable? why or why not? A: Yes.. to allow parent to control the child, and child to respond to the parent
// Should signals be passed as props? why or why not?
// How do I make props read only?
// Should handlers and slot be passed as props? or as a separate param?

type Signals<T extends AnyObject> = { [K in keyof T]: () => T[K] }

function ListItem(
    props: Signals<{
        $position: { x: number, y: number };
        $item?: string;
        $dog: string[];
        $color?: boolean;
    }> & {
        startCount: number;
        slots: {
            heading: () => Nodes<any>
        },
        reItemClicked?: (e: { frog: boolean }) => void,
    },
    context = getContext<{
        sir: string;
        robin: number;
        theBrave: boolean;
        farm?: {};
        animals?: boolean;
    }>(["robin", "sir", "theBrave"], ['farm', 'animals'])
) {

    const { $dog, $position, $color, $item, slot } = props;


    const $itemBGColor = $("blue")

    function editText() {

    }

    //TODO: I don't know what's the best way to handle these yet
    // CSS Variables
    // Dynamic styles: Atomic CSS classes? inline-styles?
    // How to best write the dynamic style classes configuration: and object of derivors? 
    // { active: () => $isActive() ? true : false }  // this seems so redundant
    // ['list-item', () => $isActive() ? 'active' : null ] // this also seems redundant... essentially translating state into a style class
    /*
        It seems redundant because css classes essentially capture semantics and state. It relates semantics, structure, and state to a style.
        Our component also has its own way of referring to state. So essentially we have to translate our component's way of referring to state to a css way.
        To eliminate this redundancy, we would need a behind the scenes translator. However this could be costly in the runtime. We would need to translate at build time.
        But also there reason why it's important to separate component state and style classes, is because sometimes they are different and you do need to map a component state to an component element style class

        The other way to do it is to use atomic style classes, so instead of mapping a component state to a css state, you just map a component state to a style
    */

    const $expensiveState = memoized$(() => {
        const expensiveCalc = 0;
        return expensiveCalc;
    })

    runReactiveEffect(() => {

    })

    const $isActive = $(true);
    const $isHighlighted = $(true);

    // const $ = o$({
    //     isActive: true // ==> .is-active
    // })


    return {
        expose: { editText },

        // prioritize being able to see the structure, semantic roles, and functionality at a glance. Define dynamic styles in helper functions and static styles in return object
        render: () =>
            mx("p", {
                class: 'list-item', // style classes are for state and reusable styles
                style: pStyle($isActive, $isHighlighted),
                nodes: [
                    mxSlot(slot, {
                        props: {

                        }
                    })
                ]
            }),


        scoped: css`
            .list-item {
                background-color: blue
            }

            .highlighted {
                --dog: "brown"
            }
        `,
    }
}


function pStyle($isActive: Signal<any>, $isHighlighted: Signal<any>) {
    return [
        () => $isActive() ? css`
            .o {
                background-color: yellow
            }
        ` : null,

        () => $isHighlighted() ? css`
            .o {
                background-color: yellow
            }
        ` : null,
    ]
}


function runReactiveEffect(effect: () => void) {

}

function memoized$(derive: () => any) {
    return derive;
}

function css(style: TemplateStringsArray) {

}




function cx() {

}

type ComponentSetup<T extends AnyObject> = (props: T, context: AnyObject) => { render: () => Nodes<any> }
type ElementConfig<T extends ComponentSetup<AnyObject> | string> = {
    props?: T extends (props: infer P, emit: any) => any ? { [K in keyof P]: P[K] } : never;
    on?: T extends (props: any, emit: infer E) => any ? E extends (event: infer N, e: any) => void ? E extends ((event: any, e: infer O) => void) ? { [K in keyof N]: (e: O) => void } : never : never : never;
    class?: string | { [key: string]: () => boolean };
    style?: any;
    // nodes?: { for: (item: any) => (() => void), in: Signal<any> | [Observable<{}>, ...string[]] }[]
    nodes?: (Nodes<any> | ListRenderKit<any> | string)[]
    text?: string | (() => void)
    key?: string | number
    ref?: string
}



function mx<T extends string | ComponentSetup<any>>(tagName: T, configA?: ElementConfig<T>, configB?: ElementConfig<T>) {
    return {} as unknown as Nodes<T>
}

type Nodes<T> = { [key: number]: Node, context: T extends (props: any, context: infer C) => any ? C : never }

// function mxIf($isActive: () => boolean,)

// return () =>
//     mx('div', {
//         class: "counter",
//         style: { color() { counter.visible ? 'red' : 'blue' } },
//         on: { click: toggleColor },
//         nodes: [
//             mx('button', { text: "increment" }),
//             mx('button', { text: "decrement" }),
//         ]
//     })
