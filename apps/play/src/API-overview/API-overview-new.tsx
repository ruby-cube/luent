//@ts-nocheck
// COMPONENTS

import { component, POSTRENDER, PRERENDER } from "@rue/lumo"
import { ion, ionize } from "@rue/quarky"
import { sub } from "date-fns"


const $count = ion(0)

const $doubleCount = ion(() => $count * 2)

const fullname = ionize({
   state: ($count * 2),
   increment() {
      $count++
   },
   decrement() {
      $count--
   }
})

function fetchUser($id) {
   return Suspense(async () => {
      const res = await fetch(`http://${$userId}`)
      return res.json()
   })
}



const videoPlayer = FiniteState({
   'playing': { pause: () => 'paused' },
   'paused': { play: () => 'playing' }
})

const door = Suspense(fetchDoor)

const $userId = ion('')

const user = Suspense(async () => {
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
   let $count = ion(0)

   return component(
      <div>
         <p>{($count)}</p>
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
   let $count = ion(0)

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
//    const count = ion(0, {
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
   let $count = ion(0)
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
   let $count = ion(0)

   return component(
      <div>
         <p>{($count * 2)}</p>
         <button on:click={e => { $$: $count++ }}>increment</button>
         <button on:click={e => { $$: $count-- }}>decrement</button>
      </div>
   )
}

// DERIVATIONS WITH METHODS

let $firstName = ion('')
let $lastName = ion('')

let $fullName = ion(($firstName + ' ' + $lastName), {
   set(name: string) {
      $$: [$firstName, $lastName] = name.split(' ')
   }
})

function makeAnonymous() {
   $$: $fullName = 'John Doe'
}


// STATIC VALUES IN THE TEMPLATE

export function Counter() {
   let $count = ion(0)

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
   let $count = ion(0)

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
ionicTask(() => {
   console.log('card number:', $cardNumber())
   console.log('card suit:', $cardSuit())
}) // default poster render

// Effect Cycle Phases
watch(($count), ({ current, previous }) => {
   console.log('count:', current)
}, { phase: SYNC })

watch($count, ({ current, previous }) => {
   doStateChanges(current)
}, { phase: PRERENDER })

watch($count, ({ current, previous }) => {
   manipulateDOM(current)
}, { phase: RENDER })

watch($count, ({ current, previous }) => {
   updateDatabase(current)
}, { phase: POSTRENDER })


watch($count, () => {
   console.log('pre-render phase')

   await __render___()
   console.log('render phase')

   await __postrender___()
   console.log('postrender phase')
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

const $username = ion('John Doe')

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

   let $faceup = ion(startFaceup)
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
         {Match(($number))}
         {Case(1,
            <div>1</div>
         )}
         {Case(2,
            <div>II</div>
         )}
         {Case(3,
            <>
               <div>•</div>
               <div>•</div>
               <div>•</div>
            </>
         )}
         {Case(4,
            <div>....</div>
         )}
         {Case(5,
            <div>V</div>
         )}
         {Case(6,
            <div>:::</div>
         )}
         {Default(
            <div>out of bounds</div>
         )}
      </div>
   )
}


// LIST RENDERING


export function TodoList() {
   let id = 0

   const todos = ionize([], { for: 'id' })
   const $input = ion('')

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
