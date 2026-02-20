//@ts-nocheck
// COMPONENTS

import { template, POSTLUDE, PRELUDE } from "@rue/lumo"
import { ion, ionize } from "@rue/quarky"
import { sub } from "date-fns"

export function App() {

   return template(
      <>
         <h1>My Counter App</h1>
         <Counter></Counter>
      </>
   )
}

export function Counter() {
   const $count = Ion(0)

   return template(
      <div>
         <p>{$count}</p>
         <button on:click={e => $count.value++}>increment</button>
         <button on:click={e => $count.value--}>decrement</button>
      </div>
   )
}


// REACTIVITY

// ION: Reactive State

export function Counter() {
   const $count = Ion(0)

   console.log('count is', $count())

   function reset() {
      $count.value = 0
   }

   return template(
      <div>
         <p>{$count}</p>
         <button on:click={e => $count.value++}>increment</button>
         <button on:click={e => $count.value--}>decrement</button>
         <button on:click={reset}>reset</button>
      </div>
   )
}

// ION WITH METHODS

export function Counter() {
   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   return template(
      <div>
         <p>{$count}</p>
         <button on:click={e => $count.increment()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
      </div>
   )
}

// DERIVATION ION

export function DoubleCounter() {
   const $count = Ion(0)
   const $doubleCount = Ion(() => $count() * 2)

   return template(
      <div>
         <p>{$doubleCount}</p>
         <button on:click={e => $count.value++}>increment</button>
         <button on:click={e => $count.value--}>decrement</button>
      </div>
   )
}

// DERIVATION SHORTHAND IN THE TEMPLATE

export function DoubleCounter() {
   const $count = Ion(0)

   return template(
      <div>
         <p>{($count() * 2)}</p>
         <button on:click={e => $count.value++}>increment</button>
         <button on:click={e => $count.value--}>decrement</button>
      </div>
   )
}

// DERIVATIONS WITH METHODS
const $firstName = Ion('')
const $lastName = Ion('')

const $fullName = Ion(() => $firstName() + ' ' + $lastName(), {
   set state(name: string) {
      [$firstName.value, $lastName.value] = name.split(' ')
   },
   toCaps() {
      $firstName.value = $firstName().toUpperCase()
      $lastName.value = $lastName().toUpperCase()
   }
})

function makeAnonymous() {
   $fullName.value = 'John Doe'
}


// STATIC VALUES IN THE TEMPLATE

export function Counter() {
   const $count = Ion(0)

   return template(
      <div>
         <p>{$count}</p>
         <button on:click={e => $count.value++}>increment</button>
         <button on:click={e => $count.value--}>decrement</button>
         <p>initial: {$count()}</p>
      </div>
   )
}

export function Counter() {
   const $count = Ion(0)

   return template(
      <div>
         <p>{$count}</p>
         <button on:click={e => $count.value++}>increment</button>
         <button on:click={e => $count.value--}>decrement</button>
         <p>{'initial:' + $count()}</p>
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

   return template(
      <div>
         <h3>Scores</h3>
         <hr></hr>
         <p>{playerA.name}: {(playerA.points)}</p>
         <button on:click={e => playerA.points++}>+</button>
         <p>{playerB.name}: {(playerB.points)}</p>
         <button on:click={e => playerA.points++}>+</button>
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

   return template(
      <div>
         <h3>Scores</h3>
         <hr></hr>
         <p>{playerA.name}: {(playerA.points)}</p>
         <button on:click={e => playerA.points++}>+</button>
         <p>{playerB.name}: {(playerB.points)}</p>
         <button on:click={e => playerA.points++}>+</button>
      </div>
   )
}


// using derivation shorthand with reactive ops

function FruitBasket({ $selectedFruit, fruitStore }) {
   const fruits = ionize(new Set())

   function addRandomFruit() {
      const fruit = fruitStore.getRandomFruit()
      fruits.add(fruit)
   }

   return template(
      <div>
         {$selectedFruit()} {(fruits.has($selectedFruit()) ? '✅' : '❌')}
         <button on:click={addRandomFruit}>add random fruit</button>
      </div>
   )
}

// EFFECTS

// watch ions

export function Counter() {
   const $count = Ion(0)

   watch($count, () => {
      console.log('count is now', $count())
   })

   return template(
      <div>
         <p>{$count}</p>
         <button on:click={e => $count.value++}>increment</button>
         <button on:click={e => $count.value--}>decrement</button>
      </div>
   )
}

// state change event object
watch($count, ({ current, previous }) => {
   console.log('count is now', current)
   console.log('count was', previous)
})

// clean up hook
watch($count, () => {
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
watch($count, ({ current, previous }) => {
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

   return template(
      <div>
         <p>{playerA.name}: {playerA.$points}</p>
         <button on:click={e => playerA.addPoint()}>+</button>
         <p>{playerB.name}: {playerB.$points}</p>
         <button on:click={e => playerA.addPoint()}>+</button>
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

$username.value = 'Bubby';

player.name === 'Bubby' // true

watch(player.$name, () => {
   console.log('player name changed!')
})


// deep reactivity


// selective reactivity


// DYNAMIC RENDERING

// IF series
export function PlayingCard({ $number, $suit, faceup = false, $cardBack }) {
   const $faceup = Ion(faceup)

   return template(
      <div on:click={e => $faceup.value = !$faceup()}>
         {If($faceup,
            <CardFace number={$number} suit={$suit}></CardFace>
         )}
         {Else(
            <CardBack design={$cardBack}></CardBack>
         )}
      </div>
   )
}

// Match series
export function WeirdDice({ $number }) {

   return template(
      <div>
         {Match($number)}
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
   const $input = Ion('')

   function remove(index: number) {
      todos.splice(index, 1)
   }

   function add(todo) {
      todos.push(ionize(todo))
   }

   function submitTodo(e) {
      e.preventDefault()
      add({ id: ++id, text: $input() })
      $input.value = ""
   }

   return template(
      <div>
         <ul>
            {For(todos, (todo, $index) =>
               <li >
                  <p>
                     {todo.$text}
                     <button on:click={e => remove($index())}>x</button>
                  </p>
               </li>
            )}
         </ul>
         <form on:submit={submitTodo}>
            <input mu:value={$input}></input>
         </form>
      </div>
   )
}
