import { Context, getCurrentContext } from "./context-stack";
import { ContextEntries, NodeContext } from "./Context";
import { ContextKeyMap, contextTypeMap, TypeConfig } from "./ContextKey";
import { isIon, isIonicModel, toIon } from "@rue/quarky";
import { AnyObject } from "@rue/types";


export interface AppContext {
    entries?: Map<symbol | string, any>;
    parent?: AppContext,
    root: AppContext,
    global?: AppContext,
}


type ContextType<K> = K extends keyof ContextKeyMap ? _ContextInputType<ContextKeyMap[K]> : any;

export type _ContextInputType<C> =
    C extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion' | '$Ref'; required: true } & ((arg: any) => { $inputType: infer I }) ? I
    : C extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion' | '$Ref'; optional: '?' | 'withDefault'; $inputType: infer I } ? I | undefined
    : C extends { required: true } & ((arg: any) => { inputType: infer I }) ? I
    : C extends { optional: '?' | 'withDefault', inputType: infer I } ? I | undefined
    : 'invalid typeConfig'


export function contextual<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ValidatedContextEntry<K> {
    let _context = context || getCurrentContext();
    if (!_context) throw new Error(``)

    // climb context tree
    let parent: Context | undefined = _context;
    const typeConfig = contextTypeMap.get(key)
    while (parent !== undefined) {
        const entries = parent.entries
        if (has(key, entries)) {
            const value = get(key, entries);
            if (!typeConfig) return value;
            return validateContextEntry(key, value, typeConfig)
        }
        parent = parent.parent;
    }
    if (!typeConfig){
        return undefined as ValidatedContextEntry<K>
    }
    return validateContextEntry(key, undefined, typeConfig)
}

function has(key: string | symbol, entries: Map<any, any> | Object | undefined) {
    if (entries instanceof Map) {
        return entries.has(key)
    }
    if (entries instanceof Object) {
        return key in entries
    }
    return false;
}

function get(key: string | symbol, entries: Map<any, any> | AnyObject | undefined) {
    if (entries instanceof Map) {
        return entries.get(key)
    }
    if (entries instanceof Object) {
        return entries[key]
    }
    return undefined;
}




export function createAppContext(entries: AnyObject | undefined, globalContext: AppContext | undefined) {
    const _entries = entries ? toMap(entries) : new Map()
    const appContext = {
        entries: _entries,
        parent: globalContext,
        root: undefined as unknown as AppContext,
        global: globalContext,
    }
    appContext.root = appContext
    return appContext;
}

function toMap(entries: AnyObject) {
    const map = new Map()
    for (const key in entries) {
        map.set(key, entries[key])
    }
    return map;
}

export function provideAppwide<K extends string | symbol>(key: K, value: ContextType<K>) {
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

export function appwide<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ValidatedContextEntry<K> {
    let _context = context || getCurrentContext();
    if (!_context) throw new Error(``)
    const rootProvider = _context.root;
    if (!rootProvider) throw new Error("No root provider found :( This should never happen")
    const typeConfig = contextTypeMap.get(key)
    const value = rootProvider.entries?.get(key)

    if (value === undefined) return transapp(key);
    if (!typeConfig) return value;
    return validateContextEntry(key, value, typeConfig)
}




export function createTransappContext<E extends ContextEntries<E>>(entries?: E) {
    const _entries = entries ? toMap(entries) : new Map()
    const global = { entries: _entries, root: undefined, global: undefined } as unknown as AppContext
    global.global = global;
    return global
}

export function provideTransapp<K extends string | symbol>(key: K, value: ContextType<K>) {
    let context = getCurrentContext();
    if (!context)
        throw new Error('')
    if (!context.global)
        throw new Error('No global context found. Call createTransappContext() and pass into createApp() via config')

    const globalEntries = context.global.entries!
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

export function transapp<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ValidatedContextEntry<K> {
    let _context = context || getCurrentContext();
    if (!_context)
        throw new Error('')
    const globalEntries = _context?.global?.entries
    const typeConfig = contextTypeMap.get(key)
    const value = globalEntries?.get(key)
    if (!typeConfig) return value;
    console.log('validate...', key)
    return validateContextEntry(key, value, typeConfig)
}





type ValidatedContextEntry<K> = K extends keyof ContextKeyMap ? _ValidatedContextEntry<ContextKeyMap[K]> : any;


type _ValidatedContextEntry<C> =
    C extends ({ required: true } | { default: true }) & ({ validatedType: infer I } | ((arg: any) => { validatedType: infer I })) ? I
    : C extends { optional: '?' } & ({ validatedType: infer I } | ((arg: any) => { validatedType: infer I })) ? I | undefined
    : any

function validateContextEntry(key: string | symbol, value: any, typeConfig: TypeConfig) {
    // const assertions = typeConfig;
    // if (assertions) { //TODO: add assertion parameter to defineContextProp or provide a registerAssertions function
    //     const _assertions = assertions instanceof Array ? assertions : [assertions]
    //     for (const assert of _assertions) {
    //         assert(isIon(value) ? value() : value);
    //     }
    // }
    if (typeConfig.optional === 'withDefault' && value === undefined && (typeConfig.default as any) instanceof Function) {
        value = (<Function><unknown>typeConfig.default)()
    }
    else if (!typeConfig.optional && value === undefined) {
        throw new Error(`Required context entry for ${String(key)} is undefined or not found.`)
    }

    switch (typeConfig.name) {
        case 'v':
            if (isIon(value)) {
                value = value()
            }
            return value; //TODO: make readonly

        case '_Ion':
        case '$Ion':
        case '$Ref':
        case '_Ref':
        case '$IonOrIon':
            if (!isIon(value)) {
                throw new Error(`[INVALID INPUT] Value of context entry, '${String(key)}', must be an ion`)
            }
            return value; //TODO: make Ion read-only, protect $Ion

        case 'MaybeIon':
            return toIon(value) //TODO: make Ion read-only

        case '_Ionized':
        case '$Ionized':
        case '$IonizedOrIonized':
            if (!isIonicModel(value)) {
                throw new Error(`[INVALID INPUT] Value of context entry, '${String(key)}', must be an ionized`)
            }
            return value; //TODO: readonly, protect

        case 'MaybeIonized':
            return value; //TODO: readonly

        default:
            return value;
    }
}



function shouldEncapsulate(value: any) {
    return !(value instanceof Function) && value instanceof Object;
}