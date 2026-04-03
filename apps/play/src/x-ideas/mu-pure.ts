import { Ion } from "@rue/quarky"

function pure<F>(fn: F): F & { pure: true } {
   return fn as F & { pure: true }
}
function reined(...args: any[]) { }
function _(...args: any[]) { }

// pure and reined modifiers
class Animal {
   readonly something = 0

   //@pure
   isSomething() {

   }

   @reined value = 0

   changeSomething(value) {
      this.value = value + '!'
   }
}

//@pure
function sum() {

}

function takeIn<F>(pure: F & { pure: true }) {

}


const $count = ion(0, class {

   @_ increment() {

   }

   @_ decrement() {

   }
})



class AnimalB {
   readonly something = 0

   // pure compiled output

   constructor() {
      this.isSomething.pure = true
   }

   isSomething(b) {
      // real-time checks
      if ( __DEV__) assertPure(doSomething)
      const a = doSomething(b)
      // linter checks for =, +=, ++, --, etc operations
   }


   // reined compiled output

   private _value = 0

   get value() {
      return this._value
   }

   set value() {
      throw new Error('a reined property can only be set internally')
   }

   changeSomething(value) {
      this._value = value + '!'
   }
}

// in order to use assignment operators, you must prefix line with mu: keyword.
// but in order to prefix line with mu:, it must either be locally created or input attribute must be prefixed with 'mu:'
function Stuff(input = FromTag<{
   'mu:frog': Ion<string>,
   'mm:changeSomething': () => void
   'can:isSomething': () => boolean
}>) {
   const { $frog } = input()

   mu: $frog.value = 'kermit'
   mu: changeSomething()
}


// QUESTION:
// [ ] what about mu?:frog --allowing parent component to decide whether to mutate or not
//     how do you check if it's mutable?   compile to if (mu($frog))
// [ ] if an ion is maybe mu, how do you pass it to <input mu:value={$frog} /> ?  
//     $frog needs to be wrapped so it's not mutable, then input checks if it's mutable or not. Does nothing if it's not mutable.
//     mu: means maybe mutable. For an input to be mutable, there needs to be an unbroken chain of mu: markers from its creation