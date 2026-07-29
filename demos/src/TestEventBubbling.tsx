import { component, WithRef } from "luent"

export function Grandparent() {

   return (

      <Parent on:click={() => console.log('grandparent click')}></Parent>
   )
}

function Parent(setup: WithRef<typeof Child>) {

   return (

      <Child on:click={() => console.log('parent click')} auto-bind={setup}></Child>
   )
}

function Child(setup: WithRef<'div'>) {

   return (

      <div on:click={() => console.log('child click')} auto-bind={setup}>CLICK ME</div>
   )
}