// import { InjectionKey } from 'vue';
import { InjectionKey } from 'vue';

type Dog = "dog"

// type InjectionKey<S, T> = Omit<T, SymbolKeys>;
const oh = Symbol("oh") as InjectionKey<"hello">

const aSymbol = injectionKey("a", {
    frog: <C>null as "kermit"
});
const bSymbol = injectionKey("b", { dogB: "dog" });
const cSymbol = injectionKey("c", {
    dogpi: 8 as const
})

// type Sym<N, T> = symbol & { __value: T } & { __name: N }

function injectionKey<T, N extends string>(name: N, schema: T) {
    const _symbol = Symbol(name);
    return _symbol as typeof _symbol & { __value: T, __name: N };
}




const a1Symbol = injectionKey("a1Symbol", {
    doubleV: "W"
});


const b1Symbol = injectionKey("b1Symbol", { rabbitB: 7 })
const c1Symbol = injectionKey("c1Symbol", { rabbitC: 7 })
const a2Symbol = injectionKey("a2Symbol", { dinoA: 300 })
const b2Symbol = injectionKey("b2Symbol", { dinoB: 300 })
const c2Symbol = injectionKey("c", { dinoC: 300 })
const a3Symbol = injectionKey("a3Symbol", 7)
const b3Symbol = injectionKey("b", 7)
const c3Symbol = injectionKey("c", 7)


// type WhatIs = Omit<C3Symbol, SymbolKeys>

type SymbolKeys = "toString" | "valueOf" | "description" | typeof Symbol.toPrimitive | typeof Symbol.toStringTag | 0


export const ListItem = defineComponent({
    name: "ListItem",
    components: {

    },
    // inject: ["hey" as const, "b" as const],
    inject: [
        a1Symbol,
        aSymbol,
        bSymbol,
        cSymbol,
        b2Symbol,
        b1Symbol,
        c1Symbol,
        a2Symbol,
        c2Symbol,
        a3Symbol,
        b3Symbol,
        c3Symbol,
    ],
    setup(props, { provide, inject }) {
        // provide(<A3Symbol>a3Symbol, { dogI: "dog", cat: "cat" })
        provide(a1Symbol, {
            doubleV: ""
        })
        provide(c3Symbol, 60)
        return /* <ListItem> */
    },
})


export const ListBlock = defineComponent({
    name: "ListBlock",
    components: {
        ListItem
    },
    inject: [<ASymbol>aSymbol],
    setup(props, { provide, inject }) {
        return /* <ListBlock> */
    },
})


export const AppComp = defineComponent({
    name: "App",
    components: {
        ListBlock
    },
    inject: [],
    setup(props, { provide, inject }) {
        return /* macro: <AppComp> */
    },
})

export const AppComp = defineComponent({
    name: "App",
    components: {
        ListBlock
    },
    inject: [],
    setup(props, { provide, inject }) {
        return renderer(/* $set */);
    },
})






// export declare function provide<T>(key: InjectionKey<T> | string | number, value: T): void;

// type ComponentConfig = {
//     name?: string;
//     components?: { [key: string]: ComponentDef };
//     inject?: symbol[];
//     setup: (props: unknown, context: { provide: Provider, inject: Injector }) => void;
// }
type ComponentDef = {
    name?: string;
    components?: { [key: string]: ComponentDef };
    inject?: symbol[];
}
type Provider<S extends { __value: any, __name: string } | string> = <T extends S>(key: T, value: T extends { __value: any } ? T["__value"] : never) => void;
type Injector = (key: symbol) => any;


function defineComponent<
    INJ extends (symbol & { __value: any, __name: string })[],
    STP extends (props: unknown, context: { provide: Provider<INJ extends { [Key in keyof INJ]: infer S } ? S | S["__name"] : never>, inject: Injector }) => void
>(config: {
    name?: string;
    components?: { [key: string]: ComponentDef };
    inject?: INJ;
    setup?: STP;
}) {
    const componentDef = {
        ...config
    }
    // as {
    //     name: string;
    //     components: CFG extends { components: infer CPS } ? CPS : never,
    //     inject: CFG extends { inject: infer I } ? I : never;
    //     // setup
    // }
    return componentDef;
}



function trying<A extends string, B extends (arg: { b: A }) => void>(config: { a: A, b: B }) {

}

trying({
    a: "dog" as const,
    b(arg) {
        arg.b
    }
})


const BabyFrog = defineComponent({
    name: "BabyFrog",
    components: {

    }
})

const Frog = defineComponent({
    name: "Frog",
    components: {
        BabyFrog
    }
})


type StringLiteral<T> = T extends string ? string extends T ? never : T : never;



function inferA<T extends symbol, A extends T[]>(...args: [...A]) {
    return args;
}

const numbersA = inferA(aSymbol, bSymbol); // ["one", "two"]

function inferB<T extends symbol>(...args: T[]) {
    return args;
}

const numbersB = inferB(aSymbol, bSymbol); // ("one" | "two")[]