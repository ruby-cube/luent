import { component, If, RenderSlot, FromTag } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestNormalizeToRenderFunction(){
   const $active = ion(true)
   const $msg = ion('hellow world')
   return component(
      <>
      <h1>Test Normalize to Renderfunction</h1>
      <div>{$active}</div>
      <Child>{()=>['hi', 'hello']}</Child>
      <Child>{'dog'}</Child>
      <Child>cat</Child>
      <Child>{$active}</Child>
      {If(true, <div>{$msg}</div>)}
      {If(true, $msg)}
      <button on:click={e=>$msg.value='bye world'}>clivk</button>
      </>
   )
}

function Child(input : FromTag<{Slot: RenderSlot}>){
   const {Slot} = input
   console.log('Slot', Slot)
   return component(
      <div>{Slot()}</div>
   )
}