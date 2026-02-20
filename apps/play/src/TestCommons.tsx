// @ts-nocheck

import { Commons, template, fromContext } from "@rue/lumo";
import { Ion, watch } from "@rue/quarky";

const Nub = Commons
const fromContext = fromContext

export function TestCommons() {

   const $message = Ion('hello')

   return template(
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
   const $message = fromContext('$message')

   const $count = Ion(0, {
      increment() {
         $count.value++
      }
   })

   watch($count, () => {
      console.log(fromContext('$message')())
   })

   return template(
      <>
         <div>{$message}</div>
         <div>{$count}</div>
         <button on:click={$count.increment}>increment</button>
      </>
   )
}