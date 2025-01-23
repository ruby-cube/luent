import { component, fromCommons, watch } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestCommons() {

   const $message = ion('hello')

   return component(
      <>
         <h1>Something</h1>
         <$--commons provide={{ $message }}>
            <Child></Child>
         </$--commons>
         <input value={$message} on:input={e => $message.state = e.target.value}></input>
      </>
   )
}

function Child() {
   const $message = fromCommons('$message')

   const $count = ion(0, {
      increment() {
         $count.state++
      }
   })

   watch($count, () => {
      console.log(fromCommons('$message')())
   })

   return component(
      <>
         <div>{$message}</div>
         <div>{$count}</div>
         <button on:click={$count.increment}>increment</button>
      </>
   )
}