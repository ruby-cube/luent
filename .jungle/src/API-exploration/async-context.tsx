//@ts-nocheck
import { component, template, FromTag, listen } from "@rue/luent";


function App(input : FromTag()) {

   context.atMount(() => {

   })

   // thisView atMount beforeUnmount (flask)

   // thisContext 

   listen(document, 'click', () => {

      // thisScene atEnd  (flask)
   })

   watch($count, () => {
      // thisScene atEnd end
   })


   return component(
      <div></div>
   )
}


function useSelector(position: number, withContext = $withContext()) {

}

function $withContext() {

}