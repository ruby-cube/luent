import { fromApp } from "./provide";

export const commonsTypeMap: Map<symbol | `${string}`, TypeConfig> = new Map();

// export function CommonsKey<D extends TypeConfig, S extends symbol | `${string}`>(symbolKey: S, typeDef: D) {
   
//     const typeConfig = {
//         key: symbolKey,
//         name: typeDef.name,
//         optional: typeDef.optional,
//         default: typeDef.default
//     } as { key: S } & D
//     commonsTypeMap.set(symbolKey, typeConfig)
//     return typeConfig
// }

export function CommonsKey<D extends TypeConfig>(typeDef: D){
   const symbolKey = Symbol('commons key');
//    const typeConfig = {
//       // key: symbolKey,
//       name: typeDef.name,
//       optional: typeDef.optional,
//       default: typeDef.default
//   } 
//   as { key: S } & D
  commonsTypeMap.set(symbolKey, typeDef)
  return symbolKey as typeof symbolKey & D
}

export function m<T extends symbol | string | TypeConfig>(key: T, value: any ){

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

export function createInjectedClass(classKey: string | symbol, contextualGetter: (key: string | symbol) => any = fromApp) {
    return (...args: any[]) => new (contextualGetter(classKey))(...args)
}

export function createInjectedFactory(classKey: string | symbol, contextualGetter: (key: string | symbol) => any = fromApp) {
    return (...args: any[]) => contextualGetter(classKey)(...args)
}






