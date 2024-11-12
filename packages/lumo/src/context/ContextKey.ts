import { appwide } from "./provide";

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
    default?: true | undefined;
    required?: true;
    optional?: '?' | 'withDefault'
}

export function createInjectedClass(classKey: string | symbol, contextualGetter: (key: string | symbol) => any = appwide) {
    return (...args: any[]) => new (contextualGetter(classKey))(...args)
}

export function createInjectedFactory(classKey: string | symbol, contextualGetter: (key: string | symbol) => any = appwide) {
    return (...args: any[]) => contextualGetter(classKey)(...args)
}

/**
 *  App developers can extend ContextKeyMap interface like so:
 *  
 *  export const Frog = Symbol('frog')
 * 
 *  const frogType = defineContextProp(FROG, v<string>)
 *  
 *  declare module './ContextKey' {
 *     interface ContextKeyMap {
 *        [DOG]: typeof frogType
 *     }
 *  }
 * 
 */
export interface ContextKeyMap { }





