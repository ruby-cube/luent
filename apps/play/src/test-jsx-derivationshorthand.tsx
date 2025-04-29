import { component, If } from "@rue/lumo";
import { ion } from "@rue/quarky";


// for root level attribute or nested property/element:
// - $= to derived
// - auto derived for function calls with $
// - single $ ion call-- transform to passing ion

export function Transformers() {
   const item = {
      active: 'active'
   }
   const $activ = ion('activ')
   const $active = ion('active')

   function Z(arg: any) {
      return ''
   }

   return component(
      <>
         {/* root level $= transform expression to derived */}
         <div class={$=item.active}></div>

         {/* root level $= transform expression to derived */}
         <div class={$={ style: $activ() + 'e' }}></div>

         {/* root level auto derived $ ion call*/}
         <div class={$activ() + 'e'}></div>

         {/* root level $= transform $ ion call to single ion */}
         <div class={$=$active()}></div>
         {/* root level $ ion call to single ion*/}
         <div class={$active}></div>

         {If($active,
            <p>hi</p>
         )}
         {If($active(),
            <p>hi</p>
         )}
         {If(!$active(),
            <p>bye</p>
         )}
      </>
   )
}