
//@ts-nocheck
// COMPONENTS

import { component, POSTLUDE, PRELUDE } from "@rue/lumo"
import { ion, ionize } from "@rue/quarky"
import { isFunction } from "@rue/utils";
import { time } from "console";
import { watch } from "fs";
import { C } from "vitest/dist/chunks/reporters.d.BFLkQcL6"

// [ ] ions with methods
// [ ] inert map
// [ ] ion typing
// [ ] mutable derivations
// [ ] writable derivations
// [ ] method traps, getter and setter traps

// function Counter() {

//    get count = Ion(0, {
//       increment() {
//          this.value++
//       },
//       decrement() {
//          this.value--
//       }
//    })

//    get doubleCount = Ion(() => count * 2)

//    return (
//       <div>
// 	       <div>{@count}</div>
// 	       <div>{@(count * 2)}</div>
// 	       <button on:click={e => @count.increment()}>increment</button>
// 	       <button on:click={e => @count.decrement()}>decrement</button>
// 	       <hr/>
// 	       <div>{store.@count}</div>
// 	       <button on:click={e => decrement(@count)}>decrement</button>
//       </div>
//    )
// }


// function decrement(@count: Ion<number, { decrement(): void }>) {
//    @count.decrement()
// }

let timeout;

const count = Ion(0, {
   increment() {

   },
   decrement() {

   },
   '@get'() {
      return this.value
   },
   '@set'(num) {
      if (timeout) return false;
      timeout = setTimeout(() => {
         timeout = undefined;
      }, 1000)
      this.value = num
   }
})

// TODO:
// settable derivation
const $doubleCount = Ion(() => $count() * 2, {
   '@set'(num: number) {
      $count.value = num / 2
   }
})

// TODO:
// writable derivations

// const $shippingMethod = Ion.watch($shippingOptions, (options, prev) => options.find(opt => opt.id === prev.id) ?? options[0])

// const $shippingMethod = Ion.watch($shippingOptions, options => options[0])

// const $shippingMethod = Ion.writable(() => $shippingOptions()[0])


// const $quantity = Ion.watch($selectedProduct, () => 1)


// const $quantity = HybridIon({
//    initial: null,
//    watch: $selectedProduct,
//    derive: () => 1
// })

const $shippingMethod = HybridIon(() => $shippingOptions()[0])


// Hybrid ion: three ways:

// (1)
const $quantity = Ion(1, {
   '@init'() {
      watch($selectedproduct, () => { this.value = 1 })
   },
   increment() {
      this.value++
   },
   decrement() {
      this.value--
   }
})

// (2)
const $shippingMethod = Ion(() => $shippingOptions()[0], { value: undefined })


// (3)
const $shippingMethod = Ion(null, { value: () => $shippingOptions()[0] })


// Async Ion
const $states = AsyncIon(fetchStates)

const $states = AsyncIon({
   initial: null,
   fetch: fetchStates,
   refetch: () => { },
   dispatch: () => { }
})

const $liked = AsyncIon({
   initial: false,
   dispatch: (liked) => {
      if (liked) db.markLiked()
      else db.unmarkLiked()
   }
}, {
   toggle() {
      this.value = !this.value
   }
})


// Optimistic

const $liked = Ion(false, {
   toggle() {
      this.value = !this.value
   },
   '@set'() {
      markLiked(this.value)
   }
})

const markLiked = AsyncOp((liked) => {
   if (liked) db.markLiked()
   else db.unmarkLiked()
})




// cases where you want to start with an initial value
// const $quantity = Ion(null, {
//    '@init'({ watch }) { watch($selectedProduct, () => 1) }
// })

// const $quantity = Ion(null, {
//    watch: [$selectedProduct, () => 1]
// })

// const $quantity = Ion(null, {
//    watch: $selectedProduct,
//    derive: () => 1
// })

// const $shippingMethod = Ion(null, {
//    derive: () => $shippingOptions()[0]
// })

// const $quantity = Ion(null, {
//    '@init'() { watch($selectedProduct, sync(() => this.value = 1)) }
// })

// const $shippingMethod = Ion(null, {
//    '@init'({ watch }) { watch($shippingOptions, ({ current }) => current[0]) }
// })

// const $shippingMethod = Ion(null, {
//    '@init'({ derive }) { derive(() => $shippingOptions()[0]) }
// })

// const $shippingMethod = Ion(null, {
//    '@init'() { runIonicTask(() => this.value = $shippingOptions()[0]) }
// })

// const $shippingMethod = Ion(null, {
//    '@init'({ watch }) { watch($shippingOptions, ({ current, previous }) => options.find(opt => opt.id === prev.id) ?? options[0]) }
// })


// TODO:
const list = Ionize([], {
   __DEV__debug: {
      push() { console.trace() },
      frog: { bequeath() { console.trace() } }
   }
})



debug.logAtoms($doubleCount)


// TODO: Identity hazards


const itemA = new Item()

const itemB = list[2] = itemA

itemB !== itemA

class Frog { }


const frogB = list[0] = { name: 'frog ' }

list.push({
   name: 'frog '
})


const frogB = list[0] = Ionized({ name: 'frog ' })

list.push(Ionized({
   name: 'frog '
}))




list.push($$({
   name: 'frog '
}))


const frogB = list[0] = $$({ name: 'frog ' })

list.push(!{
   name: 'frog '
})


const frogB = list[0] = new $$Frog('kermit')

list.push(new Frog('kermit'))





const frogB = list[0] = $$(new Frog('kermit'))

list.push($$(new Frog('kermit')))





const frogB = list[0] = Ionized(new Frog('kermit'))

list.push(Ionized(new Frog('kermit')))




// const $firstName = Ion('')
// const $lastName = Ion('')

// const fullname = ionize({
//    get value() {
//       return $firstName() + ' ' + $lastName()
//    },
//    set value(name: string) {
//       [$firstName.value, $lastName.value] = name.split(' ')
//    }
// })



function fetchUser($id) {
   return AsyncIon(async () => {
      const res = await fetch(`http://${$userId}`)
      return res.json()
   })
}



const videoPlayer = Finitron({
   'playing': { pause: () => 'paused' },
   'paused': { play: () => 'playing' }
})

const $door = AsyncIon(fetchDoor)

const $userId = Ion('')

const $user = AsyncIon(async () => {
   const res = await fetchUser($userId)
   return res.json()
})




export function App() {

   return component(
      <>
         <h1>My Counter App</h1>
         <Counter></Counter>
      </>
   )
}

export function Counter() {
   let $count = Ion(0)

   return component(
      <div>
         <p>{($count)}</p>
         {If($count), () => {
            <div>hi</div>
         }}
         <button on:click={e => { $$: $count++ }}>increment</button>
         <button on:click={e => { $$: $count-- }}>decrement</button>
      </div>
   )
}

export function Counter() {

   const count = ionize({
      value: 0,
      increment() {
         $$: this.value++
      },
      decrement() {
         $$: this.value--
      }
   })

   return component(
      <div>
         <p>{(count)}</p>
         <button on:click={e => { count.increment() }}>increment</button>
         <button on:click={e => { count.decrement() }}>decrement</button>
      </div>
   )
}


// REACTIVITY

// ION: Reactive State
function reset($count) {
   $$: $count = 0
}

export function Counter() {
   let $count = Ion(0)

   console.log('count is', $count)

   return component(
      <div>
         <p>{(fullname.$)}</p>

         <p>{(fullname.value)}</p>

         <p>{($count)}</p>
         <button on:click={e => { $$: $count++ }}>increment</button>
         <button on:click={e => { $$: $count-- }}>decrement</button>
         <button on:click={e => { reset($count) }}>reset</button>
      </div>
   )
}

// // ION WITH METHODS

// export function Counter() {
//    const count = Ion(0, {
//       increment() {
//          count++
//       },
//       decrement() {
//          count--
//       }
//    })

//    return component(
//       <div>
//          <p>{$count}</p>
//          <button on:click={e => (count).increment()}>increment</button>
//          <button on:click={e => (count).decrement()}>decrement</button>
//       </div>
//    )
// }

// DERIVATION ION

export function DoubleCounter() {
   let $count = Ion(0)
   let $doubleCount = ionic(($count * 2))

   return component(
      <div>
         <p>{($doubleCount)}</p>
         <button on:click={e => { $$: $count++ }}>increment</button>
         <button on:click={e => { $$: $count-- }}>decrement</button>
      </div>
   )
}

// DERIVATION SHORTHAND IN THE TEMPLATE

export function DoubleCounter() {
   let $count = Ion(0)

   return component(
      <div>
         <p>{($count * 2)}</p>
         <button on:click={e => { $$: $count++ }}>increment</button>
         <button on:click={e => { $$: $count-- }}>decrement</button>
      </div>
   )
}

// DERIVATIONS WITH METHODS

let $firstName = Ion('')
let $lastName = Ion('')

let $fullName = Ion(($firstName + ' ' + $lastName), {
   set(name: string) {
      $$: [$firstName, $lastName] = name.split(' ')
   }
})

function makeAnonymous() {
   $$: $fullName = 'John Doe'
}


// STATIC VALUES IN THE TEMPLATE

export function Counter() {
   let $count = Ion(0)

   return component(
      <div>
         <p>{($count)}</p>
         <button on:click={e => { $$: $count++ }}>increment</button>
         <button on:click={e => { $$: $count-- }}>decrement</button>
         <p>initial: {$count}</p>
      </div>
   )
}



// Ionized Objects: Objects with Reactive properties and methods

// with object literals
function ScoreBoard({ a, b }) {
   const playerA = ionize({
      name: a,
      points: 0
   })

   const playerB = ionize({
      name: a,
      points: 0
   })

   return component(
      <div>
         <h3>Scores</h3>
         <hr></hr>
         <p>{playerA.name}: {(playerA.points)}</p>
         <button on:click={e => { $$: playerA.points++ }}>+</button>
         <p>{playerB.name}: {(playerB.points)}</p>
         <button on:click={e => { $$: playerA.points++ }}>+</button>
      </div>
   )
}

// with classes

class Player {
   constructor(
      public name: string
   ) { }

   points = 0

   addPoint() {
      this.points++
   }
}

const player = ionize(new Player())

// using derivation shorthand to display reactive properties

function ScoreBoard({ a, b }) {
   const playerA = ionize({
      name: a,
      points: 0
   })

   const playerB = ionize({
      name: a,
      points: 0
   })

   return component(
      <div>
         <h3>Scores</h3>
         <hr></hr>
         <p>{playerA.name}: {(playerA.points)}</p>
         <button on:click={e => { $$: playerA.points++ }}>+</button>
         <p>{playerB.name}: {(playerB.points)}</p>
         <button on:click={e => { $$: playerA.points++ }}>+</button>
      </div>
   )
}


// using derivation shorthand with reactive ops

function FruitBasket({ $selectedFruit, fruitStore }) {
   const fruits = ionize(new Set())

   function addRandomFruit() {
      const fruit = fruitStore.getRandomFruit()
      $$: fruits.add(fruit)
   }

   return component(
      <div>
         {($selectedFruit)} {(fruits.has($selectedFruit) ? '✅' : '❌')}
         <button on:click={addRandomFruit}>add random fruit</button>
      </div>
   )
}

// EFFECTS

// watch ions

export function Counter() {
   let $count = Ion(0)

   watch(($count), () => {
      console.log('count is now', $count())
   })

   return component(
      <div>
         <p>{($count)}</p>
         <button on:click={e => { $$: $count++ }}>increment</button>
         <button on:click={e => { $$: $count-- }}>decrement</button>
      </div>
   )
}

// state change event object
watch(($count), ({ current, previous }) => {
   console.log('count is now', current)
   console.log('count was', previous)
})

// clean up hook
watch(($count), () => {
   const timeout = setTimeout(() => {
      console.log('timed out!')
   }, 1000)

   atCleanup(() => clearTimeout(timeout))
})

// ionic task
queueIonicTask(() => {
   console.log('card number:', $cardNumber())
   console.log('card suit:', $cardSuit())
}) // default poster render

// Effect Cycle Phases
watch(($count), ({ current, previous }) => {
   console.log('count:', current)
}, { phase: SYNC })

watch($count, ({ current, previous }) => {
   doStateChanges(current)
}, { phase: PRELUDE })

watch($count, ({ current, previous }) => {
   manipulateDOM(current)
}, { phase: RENDER })

watch($count, ({ current, previous }) => {
   updateDatabase(current)
}, { phase: POSTLUDE })


watch($count, () => {
   console.log('pre-render phase')

   await __render___()
   console.log('render phase')

   await __postrender___()
   console.log('postlude phase')
})



// BONUS REACTIVITY FEATURES

// ion access (experimental)

function ScoreBoard({ a, b }) {
   const playerA = ionize(new Player(a))
   const playerB = ionize(new Player(b))

   return component(
      <div>
         <p>{playerA.name}: {(playerA.points)}</p>
         <button on:click={e => { $$: playerA.addPoint() }}>+</button>
         <p>{playerB.name}: {(playerB.points)}</p>
         <button on:click={e => { $$: playerA.addPoint() }}>+</button>
      </div>
   )
}

// absorbed ions

const $username = Ion('John Doe')

const player = ionize({
   name: $username,
   points: 0
})

player.name === 'John Doe' // true

$$: $username = 'Bubby';

player.name === 'Bubby' // true

watch((player.name), () => {
   console.log('player name changed!')
})


// deep reactivity


// selective reactivity


// DYNAMIC RENDERING
// $ prefix is for stateful getters, not necessarily reactive
// IF series
export function PlayingCard(input: FromTag<{
   number: number,
   suit: number,
   startFaceup: boolean,
   cardBack: string
}>) {
   const { $number, $suit, startFaceup = false, $cardBack } = input

   let $faceup = Ion(startFaceup)
   const $div = NodeRef('div')

   return component(
      <div on:click={e => { $$: $faceup = !$faceup }} ref={$div}>
         {If(($faceup),
            <CardFace number={($number)} suit={($suit)}></CardFace>
         )}
         {Else(
            <CardBack design={($cardBack)}></CardBack>
         )}
      </div>
   )
}

// Match series
export function WeirdDice({ $number }) {

   return component(
      <div>
         <Switch x={$number} match={(x, c) => x.includes(c)}>
            {Case(1,
               <div>1</div>
            )}
            {Case(1.5)}
            {Case(2,
               <div>II</div>
            )}
            {Case(3,
               <article>
                  <div>•</div>
                  <div>•</div>
                  <div>•</div>
               </article>
            )}
            {Default(
               <div>out of bounds</div>
            )}
         </Switch>

         {Match($number, <>
            {Case(1,
               <div>1</div>
            )}
            {Case(1.5)}
            {Case(2,
               <div>II</div>
            )}
            {Case(3,
               <article>
                  <div>•</div>
                  <div>•</div>
                  <div>•</div>
               </article>
            )}
            {Default(
               <div>out of bounds</div>
            )}
         </>)}

         {Match(($number))
            .Case(1,
               <div>1</div>
            )
            .Case(1.5)
            .Case(2,
               <div> II</div>
            )
            .Case(3,
               <article>
                  <div>•</div>
                  <div>•</div>
                  <div>•</div>
               </article>
            )
            .Default(
               <div>out of bounds</div>
            )
         }
      </div >
   )
}


// LIST RENDERING


export function TodoList() {
   let id = 0

   const todos = ionize([], { for: 'id' })
   const $input = Ion('')

   function remove(index: number) {
      $$: todos.splice(index, 1)
   }

   function addTodo(todo) {
      $$: todos.push(todo)
   }

   function submitTodo(e) {
      e.preventDefault()
      addTodo({ id: ++id, text: input })
      $$: $input = ""
   }

   return component(
      <div>
         <ul>
            {For(todos, (todo, $index) =>
               <li >
                  <p>
                     {(todo.text)}
                     <button on:click={e => remove($index)}>x</button>
                  </p>
               </li>
            )}
         </ul>
         <form on:submit={submitTodo}>
            <input mu:value={($input)}></input>
         </form>
      </div>
   )
}
