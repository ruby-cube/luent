import { component } from "@rue/lumo";
import { FiniteState, ion } from "@rue/quarky";

export function TestFiniteIon() {
   const $color = FiniteState({
      red: { change: () => 'blue' },
      blue: { change: () => 'red' },
   })
   $color.activate(() => 'red')

   const $excited = ion(()=>{
      return $color() + '!'
   })

   return component(
      <div>
         {$excited}
         <button on:click={e => $color.apply('change')}>change</button>
      </div>
   )
}