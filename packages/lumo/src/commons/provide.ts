import { Commons, getClosestCommons } from "./commons-stack";
import { NodeCommons } from "./Commons";
import { CommonsEntryKey, getCommonsKey } from "./CommonsKey";
import { assertMutableIon, manageAccess, ValidatedInput, validateInput } from "../component/Input";
import { Ion, toIon, toValue } from "@rue/quarky";
import { access } from "fs";
import { isFunction } from "@rue/utils";


export interface AppCommons {
   entries?: Map<string, any>;
   parent?: AppCommons,
   app: AppCommons,
   global?: AppCommons,
   muIons: Set<Ion> | undefined
}



//TODO: trace provider
// fromCommons.trace('dog')(DOG)

export function fromCommons<K extends Function>(key: K, optionalOrRequired: '?' | '!' = '!', commons?: NodeCommons | AppCommons): K extends CommonsEntryKey<infer V> ? V : never {
   return _fromCommons(key, optionalOrRequired, commons)
}

function _fromCommons<K extends CommonsEntryKey | string>(key: K, optionalOrRequired: '?' | '!' = '!', commons?: NodeCommons | AppCommons, mutableIon?: 'mu' | 'mu?' | 'ro' | undefined): K extends CommonsEntryKey<infer V> ? V : never {
   let _commons = commons || getClosestCommons();
   if (!_commons) throw new Error(``)
   const commonsKey = getCommonsKey(key)
   // climb commons tree
   let parent: Commons | undefined = _commons;
   while (parent !== undefined) {
      const entries = parent.entries
      if (entries?.has(commonsKey)) {
         const value = entries?.get(commonsKey);
         return validateValue(value, mutableIon)
      }
      parent = parent.parent;
   }
   if (optionalOrRequired === '!') throw new Error('Required commons entry is missing')
   return undefined as K extends CommonsEntryKey<infer V> ? V : never
}

function validateValue(value: any, mutableIon?: 'mu' | 'mu?' | undefined) {
   if (mutableIon === 'mu') assertMutableIon(value)
   return value
}

fromCommons.asIon = fromCommonsAsIon

export function fromCommonsAsIon<K>(key: K & Function, optionalOrRequired: '?' | '!' = '!', commons?: NodeCommons | AppCommons): K extends CommonsEntryKey<infer V> ? V : never
export function fromCommonsAsIon<K>(mutableIon: 'mu' | 'mu?')
export function fromCommonsAsIon<K>(mutableIonOrKey: 'mu' | 'mu?' | K, optionalOrRequired: '?' | '!' = '!', commons?: NodeCommons | AppCommons) {
   if (isFunction(mutableIonOrKey)) {
      return _fromCommons(mutableIonOrKey, optionalOrRequired, commons, 'ro')
   }
   return function fromCommons<K extends Function>(key: K, optionalOrRequired: '?' | '!' = '!', commons?: NodeCommons | AppCommons): K extends CommonsEntryKey<infer V> ? V : never {
      return _fromCommons(key, optionalOrRequired, commons, mutableIonOrKey)
   }
}


export function createAppCommons(entries: [CommonsEntryKey, unknown][] | undefined, globalCommons: AppCommons | undefined) {
   const _entries = new Map(entries)
   const appCommons = {
      entries: _entries,
      parent: globalCommons,
      app: undefined as unknown as AppCommons,
      global: globalCommons,
   }
   appCommons.app = appCommons
   return appCommons;
}


//TODO: validate value
export function provideAppwide<K extends CommonsEntryKey>(key: K, value: RawInput<K>) {
   let commons = getClosestCommons();
   if (!commons)
      throw new Error("No commons found :(")
   const appEntries = commons.app.entries || (commons.app.entries = new Map());
   if (appEntries.has(key)) {
      if (__DEV__) {
         console.warn(`The key, '${key.toString()}', has already been used to provide app state.`)
         console.trace();
      }
      return value; //TODO: Maybe allow overrides??
   }
   appEntries.set(key, value);
   return value;
}

export function fromApp<K extends CommonsEntryKey>(key: K, commons?: NodeCommons | AppCommons): ValidatedInput<K> {
   let _context = commons || getClosestCommons();
   if (!_context) throw new Error(``)
   const appCommons = _context.app;
   if (!appCommons) throw new Error("No app commons found :( This should never happen")
   const value = appCommons.entries?.get(key)
   if (value === undefined) return fromGlobal(key);
   return validateValue(value)
}




export function createGlobalCommons(entries?: [CommonsEntryKey, unknown][]) {
   const commons = { entries: new Map(entries), app: undefined, global: undefined } as unknown as AppCommons
   commons.global = commons;
   return commons
}

//TODO: validate value
export function provideGlobal<K extends CommonsEntryKey>(key: K, value: RawInput<K>) {
   let commons = getClosestCommons();
   if (!commons)
      throw new Error('')
   if (!commons.global)
      throw new Error('No global commons found. Call createGlobalCommons() and pass into createApp() via config')

   const globalEntries = commons.global.entries!
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

export function fromGlobal<K extends CommonsEntryKey>(key: K, commons?: NodeCommons | AppCommons): K extends CommonsEntryKey<infer V> ? V : never {
   let _context = commons || getClosestCommons();
   if (!_context)
      throw new Error('')
   const globalEntries = _context?.global?.entries
   const value = globalEntries?.get(key)
   return validateValue(value)
}




