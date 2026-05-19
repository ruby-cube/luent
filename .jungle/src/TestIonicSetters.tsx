//@ts-nocheck
import { ionize } from "@rue/quarky";

const frog = ionize({
   name: 'kermit',
}, {
   doSomething(value: string) {
      console.log('hi')
   }
})

if ( __DEV__) {
   onTriggered(frog, 'name', () => { // value set, may or may not have changed
   
   })
   onTriggered() // value changed
   onTracked(frog, 'name', () => {

   })
   // for computed
   onAtomsTracked($computedFn, (e) => {
      console.log(e.atoms)
   })

   onAtomTriggered($computedFn, e=>{

   })
}