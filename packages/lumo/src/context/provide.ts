import { Context, getActiveCommons } from "./context-stack";
import { ContextEntries, NodeContext } from "./Commons";
import { contextTypeMap, TypeConfig } from "./ContextKey";
import { isIon, isIonizedModel, toIon } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import { isNamedDerivation, unnestValue } from "../component/fromTag";
import { ContextKeyMap } from "@rue/lumo";
import { isFunction } from "@rue/utils";


export interface AppContext {
   entries?: Map<symbol | string, any>;
   parent?: AppContext,
   app: AppContext,
   global?: AppContext,
}


type ContextType<K> = K extends keyof ContextKeyMap ? _ContextInputType<ContextKeyMap[K]> : any;

export type _ContextInputType<C> =
   C extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion' | '$Ref'; required: true } & ((arg: any) => { $inputType: infer I }) ? I
   : C extends { name: '$IonOrIon' | '$IonizedOrIonized' | '$Ionized' | '$Ion' | '$Ref'; optional: '?' | 'withDefault'; $inputType: infer I } ? I | undefined
   : C extends { required: true } & ((arg: any) => { inputType: infer I }) ? I
   : C extends { optional: '?' | 'withDefault', inputType: infer I } ? I | undefined
   : 'invalid typeConfig'


export function fromCommons<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ValidatedContextEntry<K> {
   let _context = context || getActiveCommons();
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
   if (!typeConfig) {
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
      app: undefined as unknown as AppContext,
      global: globalContext,
   }
   appContext.app = appContext
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
   let context = getActiveCommons();
   if (!context)
      throw new Error("No context found :(")
   const appEntries = context.app.entries || (context.app.entries = new Map());
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

export function fromApp<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ValidatedContextEntry<K> {
   let _context = context || getActiveCommons();
   if (!_context) throw new Error(``)
   const appContext = _context.app;
   if (!appContext) throw new Error("No app context found :( This should never happen")
   const typeConfig = contextTypeMap.get(key)
   const value = appContext.entries?.get(key)
   if (value === undefined) return fromGlobal(key);
   if (!typeConfig) return value;
   return validateContextEntry(key, value, typeConfig)
}




export function createGlobalContext<E extends ContextEntries<E>>(entries?: E) {
   const _entries = entries ? toMap(entries) : new Map()
   const context = { entries: _entries, app: undefined, global: undefined } as unknown as AppContext
   context.global = context;
   return context
}

export function provideGlobal<K extends string | symbol>(key: K, value: ContextType<K>) {
   let context = getActiveCommons();
   if (!context)
      throw new Error('')
   if (!context.global)
      throw new Error('No global context found. Call createGlobalContext() and pass into createApp() via config')

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

export function fromGlobal<K extends string | symbol>(key: K, context?: NodeContext | AppContext): ValidatedContextEntry<K> {
   let _context = context || getActiveCommons();
   if (!_context)
      throw new Error('')
   const globalEntries = _context?.global?.entries
   const typeConfig = contextTypeMap.get(key)
   const value = globalEntries?.get(key)
   if (!typeConfig) return value;
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
   if (typeConfig.optional === 'withDefault' && value === undefined && isFunction(typeConfig.default as any)) {
      value = (<Function><unknown>typeConfig.default)()
   }
   else if (!typeConfig.optional && value === undefined) {
      throw new Error(`Required context entry for ${String(key)} is undefined or not found.`)
   }

   //TODO: extract to shared function with prep() to reuse logic?

   switch (typeConfig.name) {
      case 'v':
         return unnestValue(value)

      case '_Ion':
         if (!isIon(value)) {
            throw new Error(`[INVALID INPUT] Value of context entry, '${String(key)}', must be an ion`)
         }
         return value; //TODO: make Ion read-only, rein $Ion

      case 'MaybeIon':
         return toIon(value) //TODO: make Ion read-only

      case '_Ionized':
         if (!isIonizedModel(value)) {
            throw new Error(`[INVALID INPUT] Value of context entry, '${String(key)}', must be an ionized`)
         }
         return unnestValue(value); //TODO: readonly, rein

      case 'MaybeIonized':
         return unnestValue(value); //TODO: readonly

      default:
         return value;
   }
}



function shouldEncapsulate(value: any) {
   return !(isFunction(value)) && value instanceof Object;
}