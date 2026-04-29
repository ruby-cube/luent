import { Component, FromTag } from "@rue/luent"

export function Grandparent() {

   return Component(
      <Parent on:click={() => console.log('grandparent click')}></Parent>
   )
}

function Parent(setup: FromTag<typeof Child>) {

   return Component(
      <Child on:click={() => console.log('parent click')} auto-bind={setup}></Child>
   )
}

function Child(setup: FromTag<'div'>) {

   return Component(
      <div on:click={() => console.log('child click')} auto-bind={setup}>CLICK ME</div>
   )
}