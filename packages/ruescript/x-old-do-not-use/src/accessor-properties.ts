import { Glass } from "@rue/types"
import { isFunction, isObject } from "@rue/utils"

type Absorbant<T> = {
   [K in keyof T as K extends `πæ${infer S}` ? S : K extends `æ${infer S}` ? S : K]:
   K extends `πæ${string}` ? T[K] extends Get<infer V> ? V : never
   : K extends `æ${string}` ? T[K] extends Get<infer V> ? V : never
   : T[K]
} &{ [K in keyof T as K extends `πæ${infer S}` ? `æ${S}` : K]: T[K] }


export function absorbØ<T>(obj: T, keys: (keyof T)[]): Glass<Absorbant<T>> {
   const absorbant = {} as T
   for (const key of (<string[]>keys)) {
      const value = obj[key as keyof T]
      if (key.startsWith('πæ')) { // accessor property assignment
         if (!isFunction(value)) {
            throw new Error('A `get` property can only be initialized with a function')
         }
         absorbant[key.slice(1)] = value;
         Object.defineProperty(absorbant, key.slice(2), {
            get: value
         })
      }
      else if (key[0] === 'æ') { // get property assignment
         if (!isFunction(value)) {
            throw new Error('A `get` property can only be initialized with a function')
         }
         if ('value' in value) {
            absorbant[key] = value
            Object.defineProperty(absorbant, key.slice(1), {
               get: value,
               set: Object.getOwnPropertyDescriptor(value, 'value')?.set
            })
         }
         else {
            absorbant[key] = value
            Object.defineProperty(absorbant, key.slice(1), {
               get: value
            })
         }
      }
      else {
         absorbant[key as keyof T] = value
      }
   }
   console.log('absorbant', absorbant)
   return absorbant as Absorbant<T>
}

type Destructured<T, P extends PropertyKey> = {
   [K in P]: 
   K extends keyof T ? T[K] : 
   K extends `æ${infer S}` ? S extends keyof T ? T[S] : never : K extends keyof T ? T[K] : never
}

export function destructureØ<T, P extends PropertyKey[]>(obj: T, ...keys: P): Destructured<T, P[number]> {
   const destructured = {} as T
   for (const key of keys) {
      if (typeof key === 'string' && key[0] === 'æ') {
         destructured[key] = obj[key]
         // destructured[key] = Object.getOwnPropertyDescriptor(obj, key.slice(1))?.get as any
      }
      else {
         destructured[key as keyof T] = obj[key as keyof T]
      }
   }
   console.log('destructured', destructured)
   return destructured as Destructured<T, P[number]>
}



export type Get<T> = () => T

const GETTER_PREFIX = 'æ'

export function πæ<T, K>(obj: T, getterKey: K): K extends keyof T ? T[K] : K extends `æ${infer S}` ? S extends keyof T ? Get<T[S]> : K : K {
   if (typeof getterKey !== 'string' || !getterKey.startsWith(GETTER_PREFIX)) throw new Error(`getterKey must be a string that starts with ${GETTER_PREFIX}`)
   if (!isObject(obj)) throw new Error('obj must be an object')
   if (getterKey in obj) return obj[getterKey];
   const key = getterKey.slice(1)
   const descriptor = Object.getOwnPropertyDescriptor(obj, key)
   return (descriptor?.get?.bind(obj) ?? (() => obj[key])) as K extends keyof T ? T[K] : K extends `æ${infer S}` ? S extends keyof T ? Get<T[S]> : K : K
}