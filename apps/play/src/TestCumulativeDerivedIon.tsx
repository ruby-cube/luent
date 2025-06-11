import { component, For } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";

export function TestDerived() {

   const counts = ionize([0])
   const sequence = ionize([0])

   const $count = ion(0, {
      increment() {
         $count.state = $count() + 1
      }
   });

   const $accumulate = ion((prev?: number) =>
      (prev ?? 0) + $count()
   )

   function nextNumber() {
      $count.increment();
      counts.push($count()) //23:7
      sequence.push($accumulate())
   }

   function $selectedColor(index: number) {
      return $count() === index ? 'beige' : 'unset'
   }

   return component(
      <>
         {For(counts, (n, $index) =>
            <div class='count-box' style={`background-color: ${$count() === $index() ? 'beige' : 'unset'};`}>{n}</div>
         )}
         {For(counts, (n, $index) =>
            <div class='count-box' style={{ display: 'inline-block', padding: '10px', backgroundColor: ($count() === $index() ? 'beige' : 'unset') }}>{n}</div>
         )}
         <hr></hr>
         {For(sequence, (n, $index) =>
            <div style={{ display: 'inline-block', padding: '10px', backgroundColor: ($selectedColor($index())) }}>{n}</div>
         )}
         <div>{$accumulate}</div>
         <button on:click={nextNumber}>next cumulative</button>
         {CSS`
            .count-box {
               display: inline-block; 
               padding: 10px;
            }
         `}
      </>
   )
}