import { If, Portal, template } from "@rue/lumo";
import { Ion } from "@rue/quarky";

export function TestPortal() {
   const $show = Ion(false)

   return template(
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
   const $show = Ion(false)

   return template(
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