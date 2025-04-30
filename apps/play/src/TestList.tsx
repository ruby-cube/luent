import { component, For } from "@rue/lumo";
import { ionize } from "@rue/quarky";

export function PlainList() {
   // const list = ionize([
   //    { name: 'apples' },
   //    { name: 'peaches' },
   //    { name: 'pear' },
   //    { name: 'plums' },
   // ])

   const obj = ionize({name: 'apples'})

   console.log(obj.$name)

   return component(
      <>
         hello world
         {/* {For(list, (item) =>
                <p>{item.name}</p>
            )} */}
      </>
   )
}