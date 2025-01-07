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
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         <$v:mount />
         {$if($active)} {
            <>
               <List></List>
               <p>hello</p>
            </>
         }
         {$elseif($broken)} {
            <div>do something</div>
         }
         {Else} {
            <div>bleh</div>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$for(list, (item, $index) =>
            <p>hello {$index()}</p>
         )}
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {Match(key)}:
         {Case('hello')} {
            <p>hello world</p>
         }
         {Case('bye')} {
            <p>hello world</p>
         }
         {Default('hello')} {
            <p>hello world</p>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$if($active)} hello
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$if($active)} {
            <>hello</>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>

         <$v:mount />
         {$if($active)} {
            <p>hello {$userName}</p>
         }
         {$elseif($broken)} {
            <div>do something</div>
         }
         {$else} {
            <div>bleh</div>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$for(list, (item, $index) =>
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
         {$if($active)} hello
         <div>{counter.$count}</div>

      </>
   )
}

import { component, $if, $else, fade, $elseif, slide, fromTag, v, target, prep, Ion } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";
import { AnyObject } from "@rue/types";


export function MountIf() {
   const $count = ion(0, {
      increment() {
         $count.value = $count() + 1
      }
   })

   const list = ionize({
      count: 0,
   }, {
      increment(value: number) {
         return list.count = list.count + value
      }
   })

   const $active = ion(true, {
      toggle() {
         $active.value = !$active()
      }
   })

   const $ready = ion(true, {
      toggle() {
         $ready.value = !$ready()
      }
   })

   const $isMobile = ion(false, {
      toggle() {
         $isMobile.value = !$isMobile()
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
            $color.value = 'blu'
         else
            $color.value = 'lim'
      }
   })
   //NOTE: if $--transit duration is shorter than $--transition duration, it will disable $--transition transition
   return component(
      <>
         <button on:click={() => ($color.change(), todos[0].name += '!')} style={[{ color: $ = $color() + 'e' }]}>shout</button>
         <h1>Hello {todos[0].name}</h1>
         <div>{() => 'hi'}</div>
         <$--transition>
            {$if($active)}{
               <>
                  oh
                  <$--transit with={slide({ x: -100, duration: 2200 })}>
                     <h2>hi</h2>
                  </$--transit>
                  <$--transit with={slide({ x: 100, duration: 2200 })}>
                     <h2>hope</h2>
                  </$--transit>
                  {$if($ready,
                     <p>ready</p>
                  )}
               </>
            }
            {$elseif($ready)}{
               <>
                  low
                  <h2>balloon</h2>
               </>
            }
            {$else}{
               <>
                  so
                  <h2>bye</h2>
               </>
            }
         </$--transition>
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
