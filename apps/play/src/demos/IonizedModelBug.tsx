import { component } from "@rue/lumo";
import { ionize, watch, } from "@rue/quarky";

export function IonizedModelBug() {
   // const messages = ionize(['a', 'b', 'c'])
   const frog = ionize({name: 'sir robin'})

   watch(frog, () => {
      console.log('### B) new frog!')
   }, { sync: true })

   watch(frog, () => {
      console.log('### A) new frog!')
   }, { sync: true })

   watch(frog, () => {
      console.log('### C) new frog!')
   }, { sync: true })
   // watch(messages, () => {
   //    console.log('### B) new message!')
   // }, { sync: true })

   // watch(messages, () => {
   //    console.log('### A) new message!')
   // }, { sync: true })

   // watch(messages, () => {
   //    console.log('### C) new message!')
   // }, { sync: true })

   function receiveNewMessage(){
      // messages.push('o')
      frog.name = frog.name === 'sir robin' ? 'kermit' : 'sir robin'
   }

   return component(
      <>
         <div>hi</div>
         <button on:click={e => receiveNewMessage()}>receive new message</button>
      </>
   )
}