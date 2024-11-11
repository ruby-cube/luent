import { fromApp } from "./provide";

export const contextTypeMap: Map<symbol | `${string}`, TypeConfig> = new Map();

export function defineContextProp<D extends TypeConfig, S extends symbol | `${string}`>(symbolKey: S, typeDef: D) {
    const typeConfig = {
        key: symbolKey,
        name: typeDef.name,
        optional: typeDef.optional,
        default: typeDef.default
    } as { key: S } & D
    contextTypeMap.set(symbolKey, typeConfig)
    return typeConfig
}


export type TypeConfig = {
    name: string,
    validatedType?: any,
    inputType?: any,
    $inputType?: any,
    default?: Function | undefined;
    required?: true;
    optional?: '?'
}

export function createInjectedClass(classKey: TypeConfig, get: (key: TypeConfig) => any = fromApp) {
    return (...args: any[]) => new get(classKey)(...args)
}

export function createInjectedFactory(classKey: TypeConfig, get: (key: TypeConfig) => any = fromApp) {
    return (...args: any[]) => get(classKey)(...args)
}

export interface ContextKeyMap {}




