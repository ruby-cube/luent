import { AnyObject } from "@rue/types";
import { ionize, Ionized, IsIonized, isIonizedModel } from "./ionize";
import { isFunction } from "@rue/utils";
import { Collection } from "@rue/lumo";
import { InertCollectionType } from "./IonizedModelQuark";

const inertObjects: WeakSet<AnyObject> = new WeakSet()

export type Inert<T = {}> = T & { '~inert': true }

function _inert<T>(obj: T): T extends Function ? T : IsIonized<T> extends true ? T : T extends object ? Inert<T> : T {
   if (!(obj instanceof Object)) throw new Error("Only objects can be marked as inert")
   if (isIonizedModel(obj)) throw new Error('cannot mark an ion or ionized model as inert')
   if (isFunction(obj)) throw new Error(`Functions are inert by default`)
   inertObjects.add(obj)
   return obj as T extends Function ? T : IsIonized<T> extends true ? T : T extends object ? Inert<T> : T
}

_inert['~markInert'] = true as true

export { _inert as inert }

export function isInert<T extends AnyObject>(value: T): value is Inert<T> {
   return inertObjects.has(value)
}

type ItemCollection<T> = Array<T> | Set<T>


const inertCollections: WeakMap<AnyObject, InertCollectionType> = new WeakMap()

//QUESTION: if you mark an object inert one place, but not another, you end up with mismatched types. How to rectify this?
// A) Make it a rule that if you ionize an object on its instantiation so that an object 
// that is ionized in the system does not have a raw reference anywhere
// - never ionize an object unless you yourself have instantiate it
// - if you need an object to be ionized, type it as ionized in the input type so that the parent knows to ionize it on instantiation

//TODO: for inertCollections, inert marking should happen on insert, not on access



export type BasicInertItemCollection<T> =
   T extends Array<infer I> ? Array<Inert<I>>
   : T extends Set<infer I> ? Set<Inert<I>>
   : T extends Map<infer K, infer I> ? Map<K, Inert<I>>
   : InertItemCollection<T>


function withInertItems<T>(value: T): BasicInertItemCollection<T> {

}



// function withInertKeys() {

// }

// function withInertEntries() {

// }

// const something = ionize({
//    list: withInertItems([] as Frog[]) // Inert<Frog>[]
// })

// const list = ionize.withInertItems([new Doc()])

// function ionizeWithInertItems(){

// }