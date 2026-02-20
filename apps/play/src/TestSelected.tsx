import { template, For } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestCustomRadioSelection() {
   const choices = [1, 2, 3]
   const $selectedItem = Ion(undefined as number | undefined)

   function selectItem(item: number) {
      $selectedItem.value = item;
   }

   return template(
      For(choices, (item) =>
         <p class={{ selected: (item === $selectedItem()) }} on:click={e => selectItem(item)}>
            {item}
         </p>
      )
   )
}