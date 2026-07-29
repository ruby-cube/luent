//@ts-nocheck
import { component, template, FromTag, listen } from "luent";


function App(input : FromTag()) {

   context.atAttach(() => {

   })

   // thisView atAttach beforeDetach (flask)

   // thisContext 

   listen(document, 'click', () => {

      // thisScene atEnd  (flask)
   })

   watch($count, () => {
      // thisScene atEnd end
   })


   return (

      <div></div>
   )
}


function useSelector(position: number, withContext = $withContext()) {

}

function $withContext() {

}