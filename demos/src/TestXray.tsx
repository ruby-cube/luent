import { component, fromTag, FromTag, WithRef } from "@rue/luent"
import { Xray } from "packages/luent/src/component/bindings"

export function TestXray() {
   return component(
      <Board
         style={{ 'color': 'red' }}
         on:click={e => console.log('click outer')}
         xray:button={x => <x.button on:click={() => console.log('clicked')} style='background-color: green'/>}
      ></Board>
   )
}




function Board(setup: WithRef<'div'> & {
   'xray:button'?: Xray<'button'>
}) {
   const { xray, ...rest } = fromTag(setup)
  console.log('xray?', xray)
   return component(
      <div auto-bind={rest}>
         all red
         <button on:click={() => console.log('i click')} auto-bind={xray.button}>click</button>
      </div>
   )
}