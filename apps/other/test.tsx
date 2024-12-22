import { setUpNode } from "@rue/lumo"

function App() {
   const outer_div = defineAttributes('video', () => {

   })

   const withColors = defineStyle(() => {
      color: 'red'
   })

   const something = defineForJSX(()=>{

   })

   return (
      <video {...outer_div()} style={[]}></video>
   )
}

function defineAttributes(...args: any[]) {
   return () => ({})
}

function defineStyle(...args: any[]) { //and class
   return () => ({})
}

function defineForJSX(...args: any[]) {
   return () => ({})
}