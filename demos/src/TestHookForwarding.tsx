import { component, If, Xray } from "@rue/luent";
import { ion } from "@rue/quarky";

export function TestHookForwarding() {

   return component(
      <Comp
         pre:attach={node => console.warn('node', node)}
         xray:root={x => <x.div
            pre:attach={node => console.warn('div node', node)}
            on:click={e => console.log('clicked the root')} />}
      ></Comp>
   )
}

function Comp(setup: {
   'xray:root'?: Xray<'div'>
}) {
   const { xray } = setup

   const $active = ion(true)

   return component.as({
      hey: true
   })(
      <div auto-bind={xray.root}>
         <button on:click={e => $active.value = !$active()}>click</button>
         {If($active,
            <div>yeah</div>
         )}
      </div>
   )
}