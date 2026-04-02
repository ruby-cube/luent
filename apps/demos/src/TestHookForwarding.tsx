import { FromTag, If, template } from "@rue/luent";
import { Ion } from "@rue/quarky";

export function TestHookForwarding() {
   return template(
      <Comp at:mount={node => console.log('node', node)}></Comp>
   )
}

function Comp(setup: FromTag<'div'>) {
   const { ...other } = setup

   const $active = Ion(true)

   return template(
      <div {...other}>
         {If($active,
            <div>yeah</div>
         )}
      </div>
   )
}