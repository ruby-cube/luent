import { AnyObject } from "@luently/types"
import { debug, isObject } from "@luently/utils"
import { ProxyKey } from "./ModelQuark"

export type Constructor = new (...args: any[]) => any

type Config<T = any> = {
   clone: Cloner<T>
} & CollectionHooks

type CollectionHooks = {
   '@initEach'?(item: any, target: AnyObject, transform: (value: unknown) => unknown, index: number): void
   '@getHookKey'?(key: ProxyKey): ProxyKey
}

export type IonicDef<T = any> = {
   [K in Exclude<keyof T, number>]?: T[K] extends (...args: any[]) => any ? MethodDef<T, T[K]> : PropertyDef
}

export interface CustomThis<T = AnyObject, P = any> {
   raw: T,
   ionic: { [key: ProxyKey]: P },
   config: AnyObject | undefined
   mutate: <R>(
      mutationFn: (raw: AnyObject) => R,
      triggerFn: (mutation: { output: R, op: MutationOp }) => void
   ) => R
}

export interface TrackableThis {
   trackModel(): void,
   track(op: string, key: unknown): void
}

export interface MutationOp {
   triggerModel(): void,
   trigger(op: string, key: unknown): void
   triggerAll(op: string): void
}

type Cloner<T> = (entity: T) => T

export type PropertyDef = {
   get?(this: TrackableThis & CustomThis): unknown
   set?(this: MutationOp & CustomThis, value: unknown): unknown
}

export type MethodDef<T, F extends (...args: any[]) => any> = (this: TrackableThis & CustomThis<T, F>, ...args: Parameters<F>) => ReturnType<F>

const ionicDefMap: Map<Constructor, { config: Config, def: IonicDef | undefined }> = new Map()


export function getIonicDef(constructor: Constructor) {
   return ionicDefMap.get(constructor)
}

/** Library API */
export function defineIonicCollection<C extends Constructor>(constructor: C, config: Config<C extends { prototype: infer T } ? T : never>, def?: IonicDef<C extends { prototype: infer T } ? T : never>) {
   defineIonicStructure(constructor, config, def)
}


/** Library API */
export function defineIonicCollective<C extends Constructor>(constructor: C, config: Config<C extends { prototype: infer T } ? T : never>, def?: IonicDef) {
   defineIonicStructure(constructor, config, def)
}


function defineIonicStructure(constructor: Constructor, config: Config, def: IonicDef | undefined) {
   const existingDef = ionicDefMap.get(constructor)
   if (existingDef){
      debug.warn(`Ionic ops for ${constructor.name} already defined`)
   } 
   ionicDefMap.set(constructor, { config, def })
}