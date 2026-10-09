import { component, If, Portal, template } from "luent";
import { Ion } from "@luently/quarky";

export function TestPortal() {
   const $show = ion(false)

   return (

      <div>
         <div on:click={e => $show.value = !$show()}>This is not teleported</div>
         <o--portal to='body'>
            {If($show,
               <div>hello I teleported</div>
            )}
         </o--portal>
      </div>
   )
}

export function TestPortalB() {
   const $show = ion(false)

   return (

      <div>
         <div on:click={e => $show.value = !$show()}>This is not teleported</div>
         {If($show,
            <o--portal to='body'>
               <div>hello I teleported</div>
            </o--portal>
         )}
      </div>
   )
}