import { Commons, getClosestCommons } from "./commons-stack";
import { NodeCommons } from "./Commons";
import { CommonsEntryKey, RawInput, TYPE_DEF } from "./CommonsKey";
import { manageAccess, ValidatedInput, validateInput } from "../component/InputTypes";


export interface AppCommons {
   entries?: Map<CommonsEntryKey, any>;
   parent?: AppCommons,
   app: AppCommons,
   global?: AppCommons,
}

//TODO: trace provider
// fromCommons.trace('dog')(DOG)

export function fromCommons<K extends CommonsEntryKey>(key: K, commons?: NodeCommons | AppCommons): ValidatedInput<K> {
   let _context = commons || getClosestCommons();
   if (!_context) throw new Error(``)
   const typeDef = key[TYPE_DEF]
   const access = typeDef.access

   // climb commons tree
   let parent: Commons | undefined = _context;
   while (parent !== undefined) {
      const entries = parent.entries
      if (has(key, entries)) {
         const value = get(key, entries);
         return manageAccess(validateInput(value, typeDef, key), access);
      }
      parent = parent.parent;
   }
   return manageAccess(validateInput(undefined, typeDef, key), access);
}

function has(key: CommonsEntryKey, entries: Map<CommonsEntryKey, any> | undefined) {
   if (entries instanceof Map) {
      return entries.has(key)
   }
   return false;
}

function get(key: CommonsEntryKey, entries: Map<CommonsEntryKey, any> | undefined) {
   if (entries instanceof Map) {
      return entries.get(key)
   }
   return undefined;
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
   const typeDef = key[TYPE_DEF]
   return manageAccess(validateInput(value, typeDef, key), typeDef.access);
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

export function fromGlobal<K extends CommonsEntryKey>(key: K, commons?: NodeCommons | AppCommons): ValidatedInput<K> {
   let _context = commons || getClosestCommons();
   if (!_context)
      throw new Error('')
   const globalEntries = _context?.global?.entries
   const value = globalEntries?.get(key)
   const typeDef = key[TYPE_DEF]
   return manageAccess(validateInput(value, typeDef, key), typeDef.access);
}





