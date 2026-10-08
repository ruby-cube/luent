import { Bindings } from "luent"

export function Grandparent() {

   return (

      <Parent on:click={() => console.log('grandparent click')}></Parent>
   )
}

function Parent(setup: Bindings<typeof Child>) {

   return (

      <Child on:click={() => console.log('parent click')} auto-bind={setup}></Child>
   )
}

function Child(setup: Bindings<'div'>) {

   return (

      <div on:click={() => console.log('child click')} auto-bind={setup}>CLICK ME</div>
   )
}