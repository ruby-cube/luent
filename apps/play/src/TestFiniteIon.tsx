import { component } from "@rue/lumo";
import { Finitron, ion } from "@rue/quarky";

export function TestFiniteIon() {
   const $color = Finitron({
      red: { change: () => 'blue' },
      blue: { change: () => 'red' },
   })
   $color.activate(() => 'red')

   const $excited = Ion(()=>{
      return $color() + '!'
   })

   return component(
      <div>
         {$excited}
         <button on:click={e => $color.apply('change')}>change</button>
      </div>
   )
}