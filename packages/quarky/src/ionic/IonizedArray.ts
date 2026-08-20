import { ionic, EACH, INTERNAL_OP, IonizeBy, ToRaw } from "./Ionic";
import { defineIonicCollection } from "./IonicDef";
import { isIonicProxy, toRaw } from "./IonicModel";
import type { ProxyKey, triggerOp } from "./ModelQuark";



declare global {
   interface Array<T> {
      values<H>(this: H): ArrayIterator<T>;
      entries<H>(this: H): ArrayIterator<T>;

      at<H>(this: H, index: number): T | undefined;
      concat<H>(this: H, ...items: (T | T[])[]): IonizeBy<H, T[]>;
      slice<H>(this: H, start?: number, end?: number, ƒ?: 'pure'): IonizeBy<H, T[]>;

      // // Mutator methods
      pop<H>(this: H): T | undefined;
      push<H>(this: H, ...items: T[]): number;
      shift<H>(this: H): T | undefined;
      copyWithin<H>(this: H, target: number, start: number, end?: number): IonizeBy<H, T[]>;
      fill<H>(this: H, value: IonizeBy<H, T>, start?: number, end?: number): IonizeBy<H, T[]>;
      reverse<H>(this: H): IonizeBy<H, T[]>;
      sort<H>(this: H, compareFn?: (a: T, b: T) => number): IonizeBy<H, T[]>;
      splice<H>(this: H, start: number, deleteCount?: number, ...items: T[]): IonizeBy<H, T[]>;

      forEach<H, O>(
         this: H,
         callback: (this: O, value: T, index: number, array: H) => void,
         thisArg?: O
      ): void;
      find<H, O>(
         this: H,
         predicate: (this: O, value: T, index: number, array: H) => boolean,
         thisArg?: O
      ): T | undefined;
      map<U, H, O>(
         this: H,
         callback: (this: O, value: T, index: number, array: H) => U, //QUESTION: should the array be ionized?
         thisArg?: O
      ): IonizeBy<H, U[]>;
      filter<H, O>(
         this: H,
         predicate: (this: H, value: T, index: number, array: H) => boolean,
         thisArg?: O
      ): IonizeBy<H, T[]>;

      reduce<U, H>(
         this: H,
         callback: (accumulator: U, currentValue: T, index: number, array: H) => U,
         initialValue: U
      ): U;
      reduceRight<U, H>(
         this: H,
         callback: (accumulator: U, currentValue: T, index: number, array: H) => U,
         initialValue: U
      ): U;

      // // Methods introduced in ES2023
      toSorted<H>(this: H, compareFn?: (a: T, b: T) => number): IonizeBy<H, T[]>;
      toReversed<H>(this: H): IonizeBy<H, T[]>;
      with<H>(this: H, index: number, value: T): IonizeBy<H, T[]>;

      //flat // TODO:
      //flatMap

      [Symbol.iterator]<H>(): IonizeBy<H, IterableIterator<ToRaw<T>>>;
      // ionizable: 'Array'
   }
}


// B extends 'pure' ? T : 'TypeError: function must be marked pure' :  'TypeError: function must be marked pure' 



// How should these behave?

// 1. deep ionized array
// 2. array of ionized objects //This will fail identity checks because there is no way of intercepting methods like indexOf(). What is the most elegant mental model?
// 3. ion of ionized array
// 4. ionizing an array of ionized objects ... should the items be raw or ionized?
// - raw decoy, ionized decoy

// a. array output of any of these (e.g. .filter(), clone) should return an ionized model so that methods can be managed
// b. method that performs identity checks internally (e.g. indexOf()) should treat raw and ionized models as identical
// 

/*
 I don't want devs to have to worry about identity when working with raw and ionized models, 
 but because of unmanaged arrays of ionized objects, devs do have to track what is raw vs ionized..
 
 Which DX?
 A. Keep ionization invisible.
   - Discourage the creation of plain arrays of ionized objects/encourage ionizing everything.
   - Methods like .filter should return ionized model
   - Discourage using toRaw() and references to raw objects
   - disallows key transform?
   - provide an identity utility in place of x === y?
 B. Make ionization visible. Support tracking of what is ionized and what is not... via Typescript? 
   - requires complex re-typing of Array methods like splice
 */





// const todo = ionize({
//    id: 0
// })

// const todos = [todo]

// todos.indexOf(todo)

// const indexOp: TrackableOpDef = {
//    type: MemberType.TRACKABLE,
//    // input: (args: any[]) => [toRaw(args[0]), args[1]]
// }



// const arrayLengthMutatingOp: Omit<MutatingOpDef, 'type'> = {
//    preop: (target) => ({ target, prevLength: target.length }),
//    // shouldTrigger: ({ target, prevLength }) => target.length !== prevLength, // only for length mutating ops 
// }

// const creativeOp: TrackableOpDef = {
//    type: MemberType.TRACKABLE,
//    output: ionize
// }

//TODO:
// independent pion vs collective
// model vs collection

// NOTE: if a class is a subclass of Array, it MUST provide its own clone function to account for its properties and methods
// e.g.  class SpecialArray extends Array {}
// defineIonicCollection(SpecialArray, { clone: arr => new SpecialArray(...arr)})

defineIonicCollection(Array, {
   clone: (arr) => [...arr],
   '@initEach'(item, target, transform, index) {
      target[index] = transform(item)
   },

   '@getHookKey'(key) {
      return isIntegerKey(key) ? EACH : key
   }
}, {
   [Symbol.iterator]() {
      this.trackModel()
      return ionic(this.ionic[Symbol.iterator]())
   },

   at(index) {
      return this.ionic.at(index)
   },

   concat(...args: any[]) {
      // this.trackModel()
      return ionic(this.ionic.concat(...args))
   },

   filter(predicate, thisArg) {
      // this.trackModel()
      return ionic(this.ionic.filter(predicate, thisArg))
   },

   map(callback, thisArg) {
      // this.trackModel()
      return ionic(this.ionic.map(callback, thisArg))
   },

   keys() {
      // this.trackModel()
      this.track(INTERNAL_OP, 'ownKeys') // QUESTION: is this correct?
      return this.raw.keys()
   },

   slice(start?, end?) {
      // this.trackModel()
      return ionic(this.ionic.slice(start, end))
   },

   // TODO: test if this functions properly
   toSpliced(start, deleteCount, ...args) {
      // this.trackModel()
      return ionic(this.ionic.toSpliced(start, deleteCount, ...args))
   },

   // pop(){
   //    const output = this.ionic.pop()
   //    quarkOf(this.ionic).triggerAll('[[in]]')
   // }

   // splice(...args) {
   //    return ionic(this.ionic.splice(...args))
   // },

   // copyWithin(target, start, end) {
   //    return ionic(this.ionic.copyWithin(target, start, end))
   // },

   // fill(value, start, end) {
   //    return ionic(this.ionic.fill(value, start, end))
   // },

   // reverse() {
   //    return ionic(this.ionic.reverse())
   // },

   // sort(compare) {
   //    return ionic(this.ionic.sort(compare))
   // },

   toSorted(compare) {
      // this.trackModel()
      return ionic(this.ionic.toSorted(compare))
   },

   toReversed() {
      // this.trackModel()
      return ionic(this.ionic.toReversed())
   },

   with(index, value) {
      // this.trackModel()
      return ionic(this.ionic.with(index, value))
   }
})

export function isIonizedArray(target: any) {
   if (!isIonicProxy(target)) return false;
   if (Array.isArray(toRaw(target))) return true;
   return false;
}

export function isIntegerKey(key: ProxyKey) {
   if (typeof key === 'symbol') return false;
   const keyAsNumber = Number(key);
   if (isNaN(keyAsNumber)) return false;
   if (Number.isInteger(keyAsNumber)) return true
}