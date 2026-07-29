//@ts-nocheck
import { component, template } from "luent";

function App() {

   return (

      <>
         <div style={`
            min-width: ${$width()}px;
            padding: 10px 20px;
            background-color: rgb(85, 42, 42);
         `}>
            Hello World
         </div>

         {CSS`
            .header {
               background-color: red;
               padding: 10px 20px;
            }
         `}
      </>
   )
}

function CSS(string: TemplateStringsArray) {
   return ''
}