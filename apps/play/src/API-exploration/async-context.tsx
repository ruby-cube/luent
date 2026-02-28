//@ts-nocheck
import { template, FromTag, listen } from "@rue/lumo";


function App(input : FromTag()) {

   context.atMounted(() => {

   })

   // thisView atMounted atUnmount (flask)

   // thisContext 

   listen(document, 'click', () => {

      // thisScene atEnd  (flask)
   })

   watch($count, () => {
      // thisScene atEnd end
   })


   return template(
      <div></div>
   )
}


function useSelector(position: number, withContext = $withContext()) {

}

function $withContext() {

}