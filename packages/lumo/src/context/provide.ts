import { encapsulate } from "@rue/utils";
import { getCurrentContext } from "./context-stack";
import { NodeContext } from "./Context";
import { contextTypeMap } from "./ContextKey";



export interface AppContext {
    entries?: Map<symbol | string, any>;
    parent?: AppContext,
    root: AppContext,
    global?: AppContext,
}


export function provideAppwide<K extends string | string>(key: K, value: ContextType<K>) {
    let context = getCurrentContext();
    if (!context)
        throw new Error("Must call initializeRootProvider in root component setup in order to provideAppState outside of root component")
    const rootProviderEntries = context.root.entries || (context.root.entries = new Map());
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

// export function constAppState<T>(key: TypedKey<T>, initialize: () => T) {
//     return function getState() {
//         return _fromContext(key, () => provideAppState(key, initialize()), 'root')
//     }
// }

// export function letAppState<T>(key: TypedKey<T>, initialize: () => T): [() => T, (value: T) => T] {
//     function getState() {
//         return _fromContext(key, () => provideAppState(key, initialize()), 'root')
//     }
//     return [
//         getState,
//         function setState(value: T) {
//             return provideAppState(key, value)
//         }
//     ]
// }


export function fromApp<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ContextType<K> {
    let _context = context || getCurrentContext();
    if (!_context) throw new Error(``)
    const rootProvider = _context.root;
    if (!rootProvider) throw new Error("No root provider found :( This should never happen")
    if (!rootProvider.entries || !rootProvider.entries.has(key)) return undefined;
    return rootProvider.entries.get(key)
}



// export function fromContext<T, OPT extends '?' | undefined = undefined>(key: TypedKey<T>, optional?: '?'): OPT extends '?' ? T | undefined : T {
//     return _fromContext(key, optional) as OPT extends '?' ? T | undefined : T;
// }


export function fromContext<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ContextType<K> {
    let _context = context || getCurrentContext();
    if (!_context) throw new Error(``)

    // climb provider tree
    let parent: NodeContext | AppContext | null = context;
    while (parent !== null) {
        const entries = parent.entries
        if (entries.has(key)) {
            const value = entries.get(key);
            return __DEV__ && shouldEncapsulate(value) ? encapsulate(value) : value;
        }
        parent = parent.provider;
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


function shouldEncapsulate(value: any) {
    return !(value instanceof Function) && value instanceof Object;
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





export function provideGlobal<K extends string | symbol>(key: K, value: ContextType<K>) {
    let context = getCurrentContext();
    if (!context)
        throw new Error('')
    const globalEntries = context.global?.entries || (context.global = { entries: new Map(), root: context.root, global: undefined }, context.global.entries!); //TODO: need to add global
    if (globalEntries.has(key)) {
        if (__DEV__) {
            console.warn(`The key, '${key.toString()}', has already been used to provide app state.`)
            console.trace();
        }
        return value; //TODO: Maybe allow overrides??
    }
    globalEntries.set(key, value);
    return value;
}

export function fromGlobal<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ContextType<K> {
    let _context = context || getCurrentContext();
    if (!_context)
        throw new Error('')
    const globalEntries = context?.global?.entries
    const typeConfig = contextTypeMap.get(key)
    if (!globalEntries) return undefined
    //TODO: optional and default


    const value = globalEntries.get(key)
    
}


// Symbol Key
// export type TypedKey<T> = symbol & T;

// export type TypedKey<T> = (string | symbol) & T
// type Key = symbol | string

// Usage
// const SELECTION = Symbol() as TypedKey<{ position: number }> // define keys in a keys file
// provide(SELECTION, { position: 9 }) // in component
// const selection = fromContext(SELECTION); // in component