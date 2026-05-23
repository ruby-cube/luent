import { component, FromTag } from "@rue/luent"
import { Xray } from "packages/luent/src/component/bindings"

export function TestXray() {
   return component(
      <Board
         style={{ 'color': 'red' }}
         on:click={e => console.log('click outer')}
         xray:button={n => <n.button on:click={() => console.log('clicked')} />}
      ></Board>
   )
}




function Board(setup: FromTag<'div', {
   'xray:button'?: Xray<'button'>
}>) {
   const { xray, ...rest } = setup

   return component(
      <div auto-bind={rest}>
         all red
         <button on:click={() => console.log('i click')} auto-bind={xray.button}>click</button>
      </div>
   )
}