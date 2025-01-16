import { component, For } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";

export function TestDerived() {

   const counts$ = ionize([0])
   const sequence$ = ionize([0])

   const $count = ion(0, {
      increment() {
         $count.state = $count() + 1
      }
   });

   const $doubleCount = ion(() => $count() * 2)

   const $accumulate = ion((prev?: number) =>
      (prev ?? 0) + $count()
   )

   function nextNumber() {
      $count.increment();
      counts$.push($count()) //23:7
      sequence$.push($accumulate())
   }

   function beigeHighlight(o: CSSStyleDeclaration, index: number) {
      if ($count() === index) {
         o.backgroundColor = 'beige'
      }
      else {
         o.backgroundColor = 'unset'
      }
   }

   return component(
      <>
         {For(counts$, (n, $index) =>
            <div style={['display: inline-block; padding: 10px', o => beigeHighlight(o, $index())]}>{n}</div>
         )}
         <hr></hr>
         {For(sequence$, (n, $index) =>
            <div style={['display: inline-block; padding: 10px', o => beigeHighlight(o, $index())]}>{n}</div>
         )}
         <div>{$accumulate}</div>
         <button on:click={nextNumber}>next cumulative</button>
      </>
   )
}