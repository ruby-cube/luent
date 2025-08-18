//@ts-nocheck
export function TestCounterModel() {

   const counter = ionize({
      count: 0
   }, {
      increment() {
         counter.count++
      },
      decrement() {
         counter.count--
      }
   })

   return component(
      <>
         {/* <vvv:mount /> */}
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         <vvv:mount />
         {If($active)} {
            <>
               <List></List>
               <p>hello</p>
            </>
         }
         {ElseIf($broken)} {
            <div>do something</div>
         }
         {Else} {
            <div>bleh</div>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {For(list, (item, $index) =>
            <p>hello {$index()}</p>
         )}
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         <vvv:mount />
         {$match(key)}:
         {$case('hello')} {
            <p>hello world</p>
         }
         {$case('bye')} {
            <p>hello world</p>
         }
         {$default('hello')} {
            <p>hello world</p>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {If($active)} hello
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {If($active)} {
            <>hello</>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>

         <vvv:mount />
         {If($active)} {
            <p>hello {$userName}</p>
         }
         {ElseIf($broken)} {
            <div>do something</div>
         }
         {Else} {
            <div>bleh</div>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {For(list, (item, $index) =>
            <p>hello {$index()}</p>
         )}
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$match(key)}:
         {$case('hello')} {
            <p>hello world</p>
         }
         {$case('bye')} {
            <p>hello world</p>
         }
         {$default} {
            <p>hello world</p>
         }
         {If($active)} hello
         <div>{counter.$count}</div>

      </>
   )
}

import { component, If, Else, fade, ElseIf, slide, fromTag, v, target, prep, Ion } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";
import { AnyObject } from "@rue/types";




export function MountIf() {

   const $count = ion(0,
      {
         increment() {
            this.state++
         },
         update(value) {
            return this.state = value
         }
      })

   function doSomething() {
      $count.update(e.target.input.value)
      $count.value = e.target.input.value
   }

   const list = ionize({
      count: 0,
   }, {
      increment(value: number) {
         return list.count = list.count + value
      }
   })

   const $active = ion(true, {
      toggle() {
         this.state = !this.state
      }
   })

   const $ready = ion(true, {
      toggle() {
         $ready.state = !$ready()
      }
   })

   const $isMobile = ion(false, {
      toggle() {
         $isMobile.state = !$isMobile()
      }
   })

   const todos = ionize([{ name: 'bubby', date: 0 }] as { name: string, date: number }[])

   // const removed = todos.splice(0, 2)

   // function $hi() {
   // return ""
   // }
   const $color = ion('lim', {
      change() {
         if ($color() === 'lim')
            $color.state = 'blu'
         else
            $color.state = 'lim'
      }
   })
   //NOTE: if ooo-transit duration is shorter than ooo-transition duration, it will disable ooo-transition transition
   return component(
      <>
         <button on:click={() => ($color.change(), todos[0].name += '!')} style={[{ color: $ = $color() + 'e' }]}>shout</button>
         <h1>Hello {todos[0].name}</h1>
         <div>{() => 'hi'}</div>
         <Transition>
            {If($active)}{
               <>
                  oh
                  <Transit with={slide({ x: -100, duration: 2200 })}>
                     <h2>hi</h2>
                  </Transit>
                  <Transit with={slide({ x: 100, duration: 2200 })}>
                     <h2>hope</h2>
                  </Transit>
                  {If($ready,
                     <p>ready</p>
                  )}
               </>
            }
            {ElseIf($ready)}{
               <>
                  low
                  <h2>balloon</h2>
               </>
            }
            {Else}{
               <>
                  so
                  <h2>bye</h2>
               </>
            }
         </Transition>
         <button on:click={$active.toggle}>toggle active</button>
         <button on:click={$ready.toggle}>toggle ready</button>
         {/* <Child dog-sled={$color() + 'd'} on:incrementclick={e => { open(); $active.toggle()}}></Child> */}
      </>
   )
}


function CounterKit() {
   return {
      $count: ion(0)
   }
}
