import { component, FromTag, If, Xray } from "@rue/luent";
import { ion } from "@rue/quarky";

export function TestHookForwarding() {

   return component(
      <Comp
         pre:mount={node => console.warn('node', node)}
         xray:root={x => <x.div
            pre:mount={node => console.warn('div node', node)}
            on:click={e => console.log('clicked the root')} />}
      ></Comp>
   )
}

function Comp(setup: FromTag<{
   'xray:root'?: Xray<'div'>
}>) {
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