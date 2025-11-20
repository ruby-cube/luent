import { AnyObject } from "@rue/types"
import { debug, isObject } from "@rue/utils"
import { getIonizedModel, IonicProxy, ProxyKey } from "./Ionic"
import { quarkOf } from "../abstract/Quark"
import { Update } from "../reactivity/Update"
import { ModelQuark } from "./IonicModel"
import { ionize } from "./x_ionize"
import { inTrackedScope, track } from "../reactivity/Compound"
import { AtomicIonQuark } from "../ion/AtomicIon"
import { trigger } from "../reactivity/Atom"
import { CollectiveQuark } from "./x_IonicCollective"

export type Constructor = new (...args: any[]) => any


type CollectiveHooks = {
   '@initEach'?(item: any, target: AnyObject, transform: (value: unknown) => unknown, index: number): void
   '@getHookKey'?(key: PropertyKey): PropertyKey
}

export type IonicDef<T = any> = {
   [K in Exclude<keyof T, number>]?: T[K] extends (...args: any[]) => any ? MethodDef<T, T[K]> : PropertyDef
}

interface CustomThis<T = AnyObject, P = any> {
   raw: T,
   ionic: { [key: PropertyKey]: P },
   config: AnyObject | undefined
}

export interface TrackableThis {
   trackModel(): void,
   track(op: string, key: unknown): void
}

export interface TriggerableThis {
   triggerModel(): void,
   trigger(op: string, key: unknown): void
   triggerAll(op: string): void
}

export type PropertyDef = {
   get?(this: TrackableThis & CustomThis): unknown
   set?(this: TriggerableThis & CustomThis, value: unknown): unknown
}

export type MethodDef<T, F extends (...args: any[]) => any> = (this: TrackableThis & TriggerableThis & CustomThis<T, F>, ...args: Parameters<F>) => ReturnType<F>

const ionicDefMap: Map<Constructor, { hooks: CollectiveHooks | undefined, def: IonicDef }> = new Map()


export function getIonicDef(constructor: Constructor) {
   return ionicDefMap.get(constructor)
}

/** Library API */
export function defineIonicCollection<C extends Constructor>(constructor: C, hooks: CollectiveHooks, def: IonicDef<C extends { prototype: infer T } ? T : never>) {
   defineIonicStructure(constructor, hooks, def)
}


/** Library API */
export function defineIonicCollective(constructor: Constructor, def: IonicDef) {
   defineIonicStructure(constructor, undefined, def)
}


function defineIonicStructure(constructor: Constructor, hooks: CollectiveHooks | undefined, def: IonicDef) {
   const existingDef = ionicDefMap.get(constructor)
   if (existingDef && def) debug.warn(`Overriding existing Ionized Methods defintion for ${constructor.name}`)
   if (existingDef) return;
   if (def) ionicDefMap.set(constructor, { hooks, def })
}