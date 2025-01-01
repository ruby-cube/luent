import { AnyObject } from "@rue/types";
import { META } from "../ReactiveEntity";
import { asMetaIon } from "./AtomicIon";
import { isIonizedModel } from "../ionize/ionize";
import { asReinedIonizedModel } from "../ionize/ReinedIonizedModel";


export type ProtectedIon<T = any, M extends AnyObject = {}> = {
   (): T;
   [META]: { inert: boolean, o: any, asReadonly?: ProtectedIon, asDefaultReined?: ProtectedIon };
} & M
export const READONLY = Symbol('readonly')

// protected ion: no set function 
// readonly ion: no methods
// custom protected ion: no set function and only select properties and methods 

type WritableIon<T = any, M = AnyObject> = (() => T) & {
   [META]: MetaWritableIon
} & M

// ion | WritableDerivedIon | PropIon //TODO: make this into an interface instead
type MetaWritableIon = {
   inert: boolean;
   o: any;
   asReadonly?: any
   asDefaultReined?: any
   hasMethods: boolean
}

export function isWritableIon(value: any): value is WritableIon {
   if (!(value instanceof Object)) return false;
   return META in value && 'asReadonly' in value[META]
}

// export type Public = {
//    // [IS_PUBLIC]?: true
// } & (() => any)

// type _ProtectedIon<I> = I extends WritableIon<infer T, infer M> ? ProtectedIon<T, { [K in keyof M as M[K] extends (this: infer P, ...args: any[]) => any ? P extends Public ? K : never : never]: M[K] }> : Omit<I, 'as'>
// I & {[K in keyof M as M[K] extends (this: Public)=>any ? K : never]: M[K]}

/**
 * exposedKeys: methods to include in reined ion
 */
export function reinIon($ion: WritableIon, exposedKeys: PropertyKey[]) {
   if (exposedKeys.length) {
      return createCustomReinedIon($ion, exposedKeys)
   }
   if (isCustomReinedIon($ion)) {
      return $ion;
   }

   if (asMetaIon($ion).hasMethods) {
      return asReinedIon($ion);
   }
   return asReadonlyIon($ion)
}



function createCustomReinedIon($ion: WritableIon, exposedKeys: PropertyKey[]) {
   const meta = asMetaIon($ion);
   const $coreIon = meta.o;
   const proto = Object.getPrototypeOf($coreIon)
   function $customIon() {
      const value = $coreIon()
      if (isIonizedModel(value)) {
         return asReinedIonizedModel(value)
      }
      return value;
   }

   const publicMethods = new Set(exposedKeys);
   for (const key in proto) {
      if (!publicMethods.has(key)) {
         //@ts-expect-error
         $customIon[key] = protectedMethod
      }
   }

   Object.defineProperty($customIon, 'value', {
      get(){
         throw new Error('The `value` property of an ion is private. Call the ion to access its value')
      },
      set(){
         throw new Error(`'value' has been made private by rein()`)
      }
   })

   Object.setPrototypeOf($customIon, proto)

   return $customIon;
}

export function protectedMethod() {
   if (__DEV__) console.warn(`[REINED METHOD] Operation failed.`)
}

function isCustomReinedIon($ion: AnyObject) {
   return $ion.as === protectedMethod || $ion._as === protectedMethod
}

export function asReadonlyIon($ion: WritableIon) {
   if (isReadonlyIon($ion)) return $ion;
   const meta = asMetaIon($ion);
   const existing = meta.asReadonly;
   if (existing) return existing;
   return createReadonlyIon(meta);
}

function createReadonlyIon(meta: MetaWritableIon) {
   const $coreIon = meta.o

   function $readonlyIon() {
      const value = $coreIon()
      if (isIonizedModel(value))
         return asReinedIonizedModel(value)
      return value;
   }
   $readonlyIon[META] = meta;

   Object.defineProperty($readonlyIon, 'value', {
      get(){
         throw new Error('The `value` property of an ion is private. Call the ion to access its value')
      },
      set(){
         throw new Error(`'value' has been made private by rein()`)
      }
   })

   meta.asReadonly = $readonlyIon;
   return $readonlyIon;
}


function asReinedIon($ion: WritableIon) {
   if (isReinedIon($ion) || isReadonlyIon($ion)) {
      return $ion
   }
   const meta = asMetaIon($ion)
   const existing = meta.asDefaultReined
   if (existing) {
      return existing;
   }
   return createReinedIon(meta);
}

function createReinedIon(meta: MetaWritableIon) {
   const $coreIon = meta.o

   const proto = Object.getPrototypeOf($coreIon)

   function $protectedIon() {
      const value = $coreIon()
      if (isIonizedModel(value)) {
         return asReinedIonizedModel(value)
      }
      return value;
   }

   Object.defineProperty($protectedIon, 'value', {
      get(){
         throw new Error('The `value` property of an ion is private. Call the ion to access its value')
      },
      set(){
         throw new Error(`'value' has been made private by rein()`)
      }
   })

   Object.setPrototypeOf($protectedIon, proto)

   meta.asDefaultReined = $protectedIon
   return $protectedIon
}



function isReinedIon($ion: WritableIon) {
   const meta = asMetaIon($ion)
   return meta.asDefaultReined === $ion
}

function isReadonlyIon($ion: WritableIon) {
   const meta = asMetaIon($ion)
   return meta.asReadonly === $ion
}