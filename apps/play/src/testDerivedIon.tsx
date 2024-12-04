import { Component, For } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";

export function TestDerived() {

   const $counts = ionize([0])
   const $sequence = ionize([0])

   const $count = ion(0, {
      increment() {
         $count.as($count() + 1)
      }
   });

   const $accumulate = ion((prev?: number) =>
      (prev ?? 0) + $count()
   )

   function nextFib() {
      $count.increment();
      $counts.push($count())
      $sequence.push($accumulate())
   }

   return Component(
      <>
         {For($counts, (n, $index) =>
            <div style={['display: inline-block; padding: 10px', o => {
               if ($count() === $index()) {
                  o.backgroundColor = 'beige'
               }
               else {
                  o.backgroundColor = 'unset'
               }
            }]}>{n}</div>
         )}
         <hr></hr>
         {For($sequence, (n, $index) =>
            <div style={['display: inline-block; padding: 10px', o => {
               if ($count() === $index()) {
                  o.backgroundColor = 'beige'
               }
               else {
                  o.backgroundColor = 'unset'
               }
            }]}>{n}</div>
         )}
         <div>{$accumulate}</div>
         <button on:click={nextFib}>next fib</button>
      </>
   )
}