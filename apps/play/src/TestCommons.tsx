// @ts-nocheck

import { Commons, component, fromNub } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";

const Nub = Commons
const fromNub = fromNub

export function TestCommons() {

   const $message = ion('hello')

   return component(
      <>
         <h1>Something</h1>
         <Nub provide={[['$message', $message]]}>
            <Child></Child>
         </Nub>
         <input value={$message} on:input={e => $message.value = e.target.value}></input>
      </>
   )
}

function Child() {
   const $message = fromNub('$message')

   const $count = ion(0, {
      increment() {
         $count.value++
      }
   })

   watch($count, () => {
      console.log(fromNub('$message')())
   })

   return component(
      <>
         <div>{$message}</div>
         <div>{$count}</div>
         <button on:click={$count.increment}>increment</button>
      </>
   )
}