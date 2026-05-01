
class Compt {
   count: number = 0

   mutateThis(this: Compt) {

   }

   mutateWithNever(a: never) {

   }

   mutateBar(a: unknown) {

   }

   mutateFoo<T>(a: T) {

   }

   mutateRest<T extends any[]>(...args: T) {
      return [...args]
   }

   cloneGeneric<T extends any[]>(...args: [...T, 'pure']) {
      return [...args]
   }

   clone(...args: [...string[], 'pure']) {
      return [...args]
   }

   cloneB(...args: [...string[], 'pure']): string[]
   cloneB(...args: string[]) {
      return [...args]
   }

   mutates(...args: string[]) {
      this.count--
   }

   mutate(a: any) {
      this.count--
   }

   decrement() {
      this.count--
   }

   increment(p: undefined) {
      this.count++
   }

   isNegative(p: string, ƒ?: 'pure') {
      return this.count < 0
   }

   isPositive(p: string, ƒ?: 'pure'): boolean
   isPositive(p: string) {
      return this.count < 0
   }

   isZero(p?: string, ƒ?: 'pure'): boolean
   isZero(p?: string) {
      return this.count < 0
   }

   foo(x: string, ƒ?: 'pure'): boolean
   foo(x: number, ƒ?: 'pure'): boolean
   foo(x: number): boolean
   foo(x: string): boolean
   foo(x: string | number, ƒ?: 'pure') {
      return true
   }

   bar(x: string): boolean
   bar(x: number): boolean
   bar(x: string | number) {
      return true
   }
}

function Child<P>(fn: P & Pure<P>) {

}

let count = 0
const objet = new Compt()

// @ts-expect-error
Child(objet.increment)
// @ts-expect-error
Child(objet.decrement)
// @ts-expect-error
Child(objet.mutate)
// @ts-expect-error
Child(objet.mutates)
// @ts-expect-error
Child(objet.bar)
// @ts-expect-error
Child(objet.mutateFoo)
// @ts-expect-error
Child(objet.mutateBar)
// @ts-expect-error
Child(objet.mutateWithNever)
// @ts-expect-error
Child(objet.mutateThis)
// @ts-expect-error
Child(objet.mutateRest)

Child(objet.isNegative)
Child(objet.isPositive)
Child(objet.isZero)
Child(objet.clone)
Child(objet.cloneB)
Child(objet.cloneGeneric)
Child(objet.foo)

type IsAny<T> = 0 extends (1 & T) ? true : false

type IsExactlyPure<T> =
   IsAny<T> extends true ? false
   : [T] extends ['pure']
   ? ['pure'] extends [T] ? true
   : false
   : false

type IsPureParameters<Args extends any[]> =
   Required<Args> extends [...any[], infer Last]
   ? IsExactlyPure<Last>
   : false

type OverloadParameters<F> =
   F extends {
      (...args: infer A1): any
      (...args: infer A2): any
      (...args: infer A3): any
      (...args: infer A4): any
      (...args: infer A5): any
      (...args: infer A6): any
   } ? A1 | A2 | A3 | A4 | A5 | A6
   : F extends {
      (...args: infer A1): any
      (...args: infer A2): any
      (...args: infer A3): any
      (...args: infer A4): any
      (...args: infer A5): any
   } ? A1 | A2 | A3 | A4 | A5
   : F extends {
      (...args: infer A1): any
      (...args: infer A2): any
      (...args: infer A3): any
      (...args: infer A4): any
   } ? A1 | A2 | A3 | A4
   : F extends {
      (...args: infer A1): any
      (...args: infer A2): any
      (...args: infer A3): any
   } ? A1 | A2 | A3
   : F extends {
      (...args: infer A1): any
      (...args: infer A2): any
   } ? A1 | A2
   : F extends (...args: infer A) => any ? A
   : never

type AnyOverloadPure<F> =
   Extract<
      OverloadParameters<F> extends infer Args
      ? Args extends any[]
      ? IsPureParameters<Args>
      : false
      : false,
      true
   > extends never
   ? false
   : true

type Pure<F> =
   F extends (...args: any[]) => any
   ? AnyOverloadPure<F> extends true ? F
   : 'TypeError: function must be marked pure'
   : 'TypeError: not a function'

// type PureV2<F> =
//    F extends (...args: any[]) => any
//    ? Required<Parameters<F>> extends [...any[], infer Last]
//    ? [Last] extends ['pure'] ? F
//    : 'TypeError: function must be marked pure'
//    : 'TypeError: function must be marked pure'
//    : 'TypeError: not a function'

