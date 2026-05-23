import { component, template, For, NodeRef } from "@rue/luent";
import { ionic, ion } from "@rue/quarky";

export function TestSettableDerivation() {
   const names = ionic([] as string[])
   const $first = ion("")
   const $last = ion("")
   const $fullname = ion(() => $first() + " " + $last(), {
      '@set'(value: string) {
         if (value === "") { $first.value = $last.value = "" }
         else {
            const output = value.split(' ');
            if (output.length !== 2) { throw new Error('Invalid fullname') }
            [$first.value, $last.value] = output
         }
      }
   })

   const $form = NodeRef('form')

   function reSubmit(e: Event) {
      console.log('$fullname', $fullname())
      e.preventDefault();
      names.push($fullname());
      $fullname.value = ""
      console.log('names', names)
   }

   return component(
      <div>
         <form ref={$form} on:submit={e => { reSubmit(e) }}>
            <label>first:</label><input type='text' mu:value={$first}></input>
            <br />
            <label>last:</label><input type='text' mu:value={$last} on:keyup={e => { e.code === 'Enter' && $form()?.requestSubmit() }}></input>
         </form>
         <div>
            NAMES:
            {For(names, ($name, index) =>
               <div on:click={e => $fullname.value = $name()}>{$name}</div>
            )}
         </div>
      </div>
   )
}