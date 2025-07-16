//@ts-nocheck
import { component, fromTag, listen } from "@rue/lumo";


function App(input = fromTag()) {

   context.atMounted(() => {

   })

   // thisView atMounted atUnmount (flask)

   // thisCommons 

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