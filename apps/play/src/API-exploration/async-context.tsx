//@ts-nocheck
import { Component, template, FromTag, listen } from "@rue/luent";


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


   return Component(
      <div></div>
   )
}


function useSelector(position: number, withContext = $withContext()) {

}

function $withContext() {

}