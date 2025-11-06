import { Commons, getClosestCommons } from "./context-stack";
import { NodeCommons, toCommonsEntries } from "./Context";
import { CommonsEntryKey, isMuKey, toCommonsKey } from "./ContextKey";
import { assertMutableIon } from "../component/Input";
import { Ion } from "@rue/quarky";
import { isFunction } from "@rue/utils";


export interface AppCommons {
   entries?: Map<string, any>;
   parent?: AppCommons,
   app: AppCommons,
   global?: AppCommons,
   muIons: Set<Ion> | undefined
}


// TODO: trace provider
// fromContext.trace('dog')(DOG)

export function fromContext<K>(key: K, optionalOrRequired: '?' | '!' = '!', commons?: NodeCommons | AppCommons): CommonsValue<K> {
   let _commons = commons || getClosestCommons();
   if (!_commons) throw new Error(``)
   if (typeof key !== 'string' && !isFunction(key)) throw new Error('[INVALID INPUT] Invalid commons key')
   const commonsKey = toCommonsKey(key as CommonsEntryKey | string)
   // climb commons tree
   let parent: Commons | undefined = _commons;
   while (parent !== undefined) {
      const entries = parent.entries
      if (entries?.has(commonsKey)) {
         return entries?.get(commonsKey);
      }
      parent = parent.parent;
   }
   if (optionalOrRequired === '!') throw new Error('Required commons entry is missing')
   return undefined as CommonsValue<K>
}


export function createAppCommons(provided: [CommonsEntryKey | string, unknown][] | undefined, globalCommons: AppCommons | undefined) {
   const [entries, muIons] = provided ? toCommonsEntries(provided) : [undefined, undefined]
   const appCommons = {
      entries,
      parent: globalCommons,
      app: undefined as unknown as AppCommons,
      global: globalCommons,
      muIons
   }
   appCommons.app = appCommons
   return appCommons;
}

type CommonsValue<K> = K extends (arg: infer T) => any ? T : unknown

// TODO: validate value
export function provideAppwide<K extends CommonsEntryKey>(key: K, value: CommonsValue<K>) {
   let commons = getClosestCommons();
   if (!commons)
      throw new Error("No commons found :(")
   const appCommons = commons.app;
   const appEntries = appCommons.entries || (appCommons.entries = new Map());
   const commonsKey = toCommonsKey(key)
   markIfMuIon(key, value, appCommons)
   if (appEntries.has(commonsKey)) {
      if (__DEV__) {
         console.warn(`The key, '${key.toString()}', has already been used to provide app state.`)
         console.trace();
      }
      return value; // TODO: Maybe allow overrides??
   }
   appEntries.set(commonsKey, value);
   return value;
}

export function fromApp<K extends CommonsEntryKey | string>(key: K, commons?: NodeCommons | AppCommons): CommonsValue<K> {
   let _context = commons || getClosestCommons();
   if (!_context) throw new Error(``)
   const appCommons = _context.app;
   if (!appCommons) throw new Error("No app commons found :( This should never happen")
   const commonsKey = toCommonsKey(key)
   const value = appCommons.entries?.get(commonsKey)
   if (value === undefined) return fromGlobal(commonsKey) as CommonsValue<K>;
   return value
}




export function createGlobalCommons(entries?: [CommonsEntryKey | string, unknown][]) {
   const commons = { entries: new Map(entries), app: undefined, global: undefined } as unknown as AppCommons
   commons.global = commons;
   return commons
}

export function provideGlobal<K extends CommonsEntryKey | string>(key: K, value: CommonsValue<K>) {
   let commons = getClosestCommons();
   if (!commons)
      throw new Error('')
   const globalCommons = commons.global
   if (!globalCommons)
      throw new Error('No global commons found. Call createGlobalCommons() and pass into createApp() via config')
   const globalEntries = globalCommons.entries!
   const commonsKey = toCommonsKey(key)
   markIfMuIon(key, value, globalCommons)
   if (globalEntries.has(commonsKey)) {
      if (__DEV__) {
         console.warn(`The key, '${key.toString()}', has already been used to provide app state.`)
         console.trace();
      }
      return value; // TODO: Maybe allow overrides??
   }
   globalEntries.set(commonsKey, value);
   return value;
}

export const fromRoot = fromGlobal

export function fromGlobal<K extends CommonsEntryKey | string>(key: K, commons?: NodeCommons | AppCommons): CommonsValue<K> {
   let _context = commons || getClosestCommons();
   if (!_context)
      throw new Error('')
   const globalEntries = _context?.global?.entries
   const commonsKey = toCommonsKey(key)
   const value = globalEntries?.get(commonsKey)
   return value
}

export function markIfMuIon(key: string | CommonsEntryKey, value: unknown, commons: { muIons: Set<Ion> | undefined }) {
   if (isMuKey(key)) {
      assertMutableIon(value)
      commons.muIons ? commons.muIons.add(value) : (commons.muIons = new Set([value]))
   }
}



