import { Component, template, FromTag } from "@rue/luent"
import { ionic, Ion, Ionic, watch } from "@rue/quarky"

// absorbed ions
// get something 
// derivation shorthand

// QUESTION: should ions be branded? determined by name? any function? ... I think any function for now
// QUESTION: But if ions can be any function, then ion(() => $count() * 2) is pointless (unless adding methods) and should be called MemoizedIon or MemoIon or CachedIon

// NOTE: parentheses cannot be used as a shorthand to bind

const obj = {
   doSomething(a: string, b: string) {
      console.log(this)
      return 0
   }
}

function take(doSomething: (a: string, b: string) => number) {

}

take((obj.doSomething(a, b))) // typescript will not be happy

// instead

take(via(obj).doSomething)


function via<O extends object>(obj: O): O {
   return new Proxy(obj, {})
}


// NOTE: derivation shorthands only work because parameters/attributes are typed as MaybeIon or ToIon. If parameters are Ion, typescript will also not be happy


const $count = ion(0)
const $doubleCount = ion(() => $count() * 2)

class Animal {
   name: string = "creature"

   // absorbed ions
   $count = $count
   $doubleCount = $doubleCount
   $tripleCount = ($count() * 3) // X DISALLOW .. typescript will be confused. derivation shorthand only allowed in template
   $quadrupleCount = () => $count() * 4 // OK
   // $tripleCountB = $($count() * 3)


   get habitat() {
      return 'earth'
   }

   move() {

   }
}

//@ts-expect-error
fetchUser(ion(($userID() + 0)))

//@ts-expect-error
fetchUser(ion($ => $userID() + 0))

// WINNER
//@ts-expect-error
fetchUser($ => $userID() + 0)

// fetchUser(($userID() + 0))

// fetchUser($($userID() + 0))

// fetchUser($(o => $userID() + 0))

// watch($(o => $userID() + 0))

//@ts-expect-error
watch(() => $userID() + 0)

// WINNER
//@ts-expect-error
watch($ => $userID() + 0)


function fetchUser(id: Ion<string>) {

}


const animal = ionic({
   name: "creature",

   // absorbed ion
   $count: AsyncIon(() => fetch("...")),
   $doubleCount,
   $tripleCount: ($count() * 3), // X DISALLOWED. no derivation shorthand outside of template ... but what about class objects defined outside of template?

   $quadCount: () => $count() * 4, // OK

   $quadrupleCount() { // OK
      return $count() * 4
   },

   location: ion('swamp'), // QUESTION: should this throw? Not sure ... need more experience/research ... for now, throw, other possibilities is to treat like a method

   tripleCount: () => $count() * 2, // this will be treated like a method

   get habitat() {
      return "earth"
   },
   move: Animal.prototype.move
})


function Appo() {
   const $active = ion(true)
   return Component(
      <div class={{ active: $active, inactive: (!$active()) }}>
         <Child disabled={(!$active())}></Child>
      </div>
   )
}
function Child(input: FromTag<{
   disabled: Ion<boolean>
}>) {
   const $active = ion(true)

   return Component(
      <div class={{ active: $active, inactive: (!$active()) }}>
         <Child disabled={(!$active())}></Child>
      </div>
   )
}


