import { AnyObject } from "@rue/types";
import { encapsulate } from "@rue/utils";
import { onCreated } from "../dynamic/lifecycle";
import { ProviderComponent } from "./ProviderComponent";

type Component = AnyObject

// class Provider {
//     entries: Map<Symbol | string, any> = new Map();

//     constructor(
//         public component: Component,
//         public parent: Provider | null,
//         public root: Provider = this
//     ) { }
// }

// manage provider stack
let currentProvider: ProviderComponent | null = null;
let previousProvider: ProviderComponent | null = null;

export function getCurrentProvider() {
    return currentProvider;
}

export function pushProvider(provider: ProviderComponent) {
    previousProvider = currentProvider;
    currentProvider = provider;
}

export function popProvider() {
    currentProvider = previousProvider;
    previousProvider = previousProvider?.parent || null
}

// export function initializeRootProvider(component: Component) {
//     const provider = new Provider(component, null);
//     pushProvider(provider);
//     onCreated(() => {
//         popProvider()
//     })
// }

export const APPWIDE = true

export type Provide = typeof provide

// Public API
export function provide<T>(key: TypedKey<T>, value: T, appwide?: boolean) {
    if (appwide) return provideAppState(key, value)
    // const component = getCurrentComponent();
    // if (component === null) {
    //     if (__DEV__) console.warn("No component found. Providing as global state") //QUESTION: Should I throw an error instead?
    //     provideGlobal(key, value);
    //     return;
    // }
    if (!currentProvider) throw new Error("No provider component. This should never happen")
    // if (!provider || provider.component !== component) {
    //     provider = new Provider(component, provider, provider?.root);
    //     pushProvider(provider);
    //     onCreated(() => {
    //         popProvider()
    //     })
    // }
    currentProvider.entries.set(key, value);
}

export function provideAppState<T>(key: TypedKey<T>, value: T) {
    // const component = getCurrentComponent();
    // if (component === null) {
    //     if (__DEV__) console.warn("No component found. Providing as global state") //QUESTION: Should I throw an error instead?
    //     provideGlobal(key, value);
    //     return value;
    // }
    let provider = currentProvider;
    if (!provider)
        throw new Error("Must call initializeRootProvider in root component setup in order to provideAppState outside of root component")
    const rootProviderEntries = provider.root?.entries || provider.entries
    if (rootProviderEntries.has(key)) {
        if (__DEV__) {
            console.warn(`The key, '${key.toString()}', has already been used to provide app state.`)
            console.trace();
        }
        return value; //TODO: Maybe allow overrides??
    }
    rootProviderEntries.set(key, value);
    return value;
}



// type UseAppStateReturn<M, T> = M extends 'set' ? [() => T, (value: T) => T]: () => T

export function constAppState<T>(key: TypedKey<T>, initialize: () => T) {
    return function getState() {
        return _fromContext(key, () => provideAppState(key, initialize()), 'root')
    }
}

export function letAppState<T>(key: TypedKey<T>, initialize: () => T): [() => T, (value: T) => T] {
    function getState() {
        return _fromContext(key, () => provideAppState(key, initialize()), 'root')
    }
    return [
        getState,
        function setState(value: T) {
            return provideAppState(key, value)
        }
    ]
}


export function fromApp<T, OPT extends '?' | undefined = undefined>(key: TypedKey<T>, optional?: OPT): OPT extends '?' ? T | undefined : T {
    return _fromContext(key, optional, 'root');
}



export function fromContext<T, OPT extends '?' | undefined = undefined>(key: TypedKey<T>, optional?: '?'): OPT extends '?' ? T | undefined : T {
    return _fromContext(key, optional) as OPT extends '?' ? T | undefined : T;
}


export function _fromContext<T, OPT extends '?' | (() => T) | undefined>(key: TypedKey<T>, initializeOrOptional: OPT, root?: 'root'): OPT extends '?' ? T | undefined : T {
    // const component = getCurrentComponent();
    let provider = currentProvider;
    if (!provider) {
        return handleResourceNotFound(key, initializeOrOptional, root)
    }

    if (root) {
        const rootProvider = provider.root;
        if (!rootProvider.entries.has(key)) {
            if (initializeOrOptional instanceof Function) {
                return initializeOrOptional();
            }
            return handleResourceNotFound(key, initializeOrOptional, root)
        }
        const value = provider.root.entries.get(key)
        return __DEV__ && value instanceof Object ? encapsulate(value) : value;
    }

    // climb provider tree
    let parent: ProviderComponent | null = provider;
    while (parent !== null) {
        const entries = parent.entries
        if (entries.has(key)) {
            const value = entries.get(key);
            return __DEV__ && value instanceof Object ? encapsulate(value) : value;
        }
        parent = parent.parent;
    }
    try {
        if (__DEV__) console.warn(`No provider found for the key, ${key.toString()}. Checking global store...`) //TODO: Improve this error message
        return fromGlobal(key) as OPT extends "?" ? T | undefined : T;
    }
    catch (e) {
        return handleResourceNotFound(key, initializeOrOptional, root)
    }
}

function handleResourceNotFound<T, OPT extends '?' | undefined | (() => T)>(key: TypedKey<T>, initializeOrOptional: OPT, root: 'root' | undefined): OPT extends '?' ? undefined | T : T {
    if (initializeOrOptional instanceof Function && !root)
        throw new Error('An initilizer can only be used if providing from root.');
    if (initializeOrOptional === '?')
        return undefined as OPT extends '?' ? undefined : T;
    throw new Error(`A value for '${key.toString()}' has not been provided in this component's ancestry`)
}


// class RootStore {
//     rootEntries: Map<symbol | string, any> = new Map();

//     provide<T>(key: TypedKey<T> | symbol | string, value: T) {
//         globalEntries.set(key, value);
//     }
// }

// export function provideAppWide(){

// }







// export function provideLazyModule<T extends AnyObject>(config: { exports: (keyof T)[], initialize: () => T }) {
//     const { initialize, exports } = config
//     const symbolKeys = new Map();
//     for (const key of exports) {
//         symbolKeys.set(key, Symbol())
//     }

//     const module = new Proxy({}, {
//         get(_, key: keyof T) {
//             if (typeof key !== 'string')
//                 return undefined;
//             return getAppState(symbolKeys.get(key), () => {
//                 const module = initialize();
//                 for (const key of exports) {
//                     provideAppState(symbolKeys.get(key), module[key])
//                 }
//                 return module[key]
//             }
//             )
//         }
//     })

//     return module as T
// }




const globalEntries: Map<Key, any> = new Map();

export function provideGlobal<T>(key: TypedKey<T>, value: T) {
    globalEntries.set(key, value);
}

export function fromGlobal<T, OPT extends '?' | undefined = undefined>(key: TypedKey<T>, optional?: OPT): OPT extends '?' ? T | undefined : T {
    if (!optional && !globalEntries.has(key))
        throw new Error(`A value for '${key.toString()}' has not been provided globally`)
    const value = globalEntries.get(key)
    return __DEV__ && value instanceof Object ? encapsulate(value) : value;
}


// Symbol Key
// export type TypedKey<T> = symbol & T;

export type TypedKey<T> = (string | symbol) & T
type Key = symbol | string

// Usage
// const SELECTION = Symbol() as TypedKey<{ position: number }> // define keys in a keys file
// provide(SELECTION, { position: 9 }) // in component
// const selection = fromContext(SELECTION); // in component