type Context<T, P extends string = ""> = Omit<T, P>;
type Provides<K extends string> = K;


type AppContext = Context<WorkspaceContext, Provides<"color">>

type WorkspaceContext = Context<EditorContext, Provides<"frog" | "lilypad">> // provides frog

type EditorContext = Context<ListBlockContext> // does not add context requirements

type ListBlockContext = Context<{ lilypad: string } & ListItemCtx> // adds context requirements



function getTypes<T extends any[]>(t: T){
    return () => null as T[keyof T];
}

function provide<C extends { [key: string]: any }>(context: C): keyof C {

    return ""; // standin
}



function Counter(props, context) {

}

const ListItemc = defineComponent({
    setup(
        props: {

        },
        context: {

        }) {


        return {
            render() {

            },
            provide: {

            }
        }
    }
})

type Component<T extends { provides: string }> = {
    components?: Function[];
    style: string;
    render: () => void;
    provide?: { [key in T["provides"]]: any };
    emits?: { [key: string]: any }
}



// register components
// type ThisContext = Context<{ frog: string }, GetContext<Components>, Provides<ThisProvides>>
// type ThisProvides = "color";
// type Components = typeof BulletArea | typeof InputArea

// type ThisContext = Context<{
//     frog: string
// }, GetContext<
//     typeof BulletArea |
//     typeof InputArea
// >, Provides<ThisProvides>>;

type I = DefineComponent<{
    props: {
        width: number
    },
    components:
    typeof BulletArea |
    typeof InputArea
    ,
    context: {
        frog: string
    },
    provides: "color",
    emits: {
        "item-click": 9
    }
}>

type Payload<T extends (...args: any) => any, K extends string> = ReturnType<T> extends { emits: infer J } ? J extends { [key: string]: any } ? J[K] : never : never;

function ListItem(props: I["props"], context: I["context"]): Component<I> { // context type is determined by components

    function changeBullet(stuff: {}) {

    }

    const $active = $(true)

    const item = o$({
        value: 0,
        color: "blue"
    })

    const $doubleCount = compute$(() => {

    })

    const bullets = ["•"]


    return {
        render: () =>
            mx("div", {
                class: ["dark", $active, $(item.color)],
                nodes: [
                    mx("span", { text: "something" }),
                    ...bullets.map((bullet) =>
                        mx(BulletArea, {
                            class: "frog",
                            text: bullet,
                            on: {
                                "bullet-click": () => $active() ? changeBullet : null
                            }
                        }))
                ]
            }),

        style: `
                .app {
                    background-color: ${() => $active() ? $(item.color)() : 'gray'}
                }
        `,

        provide: { // calculated by components
            color: "blue"
        },

    }
}

type Th = DefineComponent<{
    props: {
    },
    context: {
        color: string
    },
    provides: ""
    emits: {
        "bullet-click": 9
    }
}>


function BulletArea(props: {}, context: Th["context"]): Component<Th> {
    function handleClick() {

        emit("bullet-click", 9)
    }

    return {
        render: () =>
            mx("button", {
                class: "dark",
                on: {
                    "click": handleClick
                }
            }),

        style: `
                .app {
                    background-color: 
                }
        `,

        emits: <Th["emits"]>{}
    }
}

type InputContext = Context<{ rope: string }>

function InputArea(props: {}, context: InputContext) {

}

function mx(name: string | Function, props?: RenderProps) {
    return () => {
        doc.createElement(name);
        if (props?.nodes) {

        }
    }
}

type _ListItemCtx = GetContext<typeof ListItem>

type GetContext<T extends (...args: any) => any> = UnionToIntersection<Parameters<T>[1]>

export type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never


type DefineComponent<CFG extends { props: { [key: string]: any }, components?: (...args: any) => any, context?: { [key: string]: any }, provides?: string, emits?: { [key: string]: any } }> = {
    props: CFG["props"];
    context: Context<CFG["context"] & GetContext<CFG["components"]>, CFG["provides"]>;
    provides: CFG["provides"];
    emits: CFG extends { emits: infer O } ? O : never;
}

type Components<C extends (...args: any) => any> = C;
type Props<T extends { [key: string]: any }> = T;