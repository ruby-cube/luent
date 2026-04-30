import { Component, FromTag } from "@rue/luent"
import { Xray } from "packages/luent/src/component/bindings"

export function TestXray() {
   return Component(
      <Board
         // xray:button={n => <n.button on:click={() => console.log('clicked')} />}
      ></Board>
   )
}




function Board(setup: FromTag<{
   'xray:button'?: Xray<'button'>
}>) {
   const { xray } = setup

   return Component(
      <div>
         <button on:click={() => console.log('i click')} auto-bind={xray.button}>click</button>
      </div>
   )
}