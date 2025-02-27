import { component } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";

export function TestPropIons() {
   const frog = ionize({
      name: 'sir robin',
      quality: 'valiant',
      setName(name: string) {
         this.name = name
      }
   }, {
      setQuality(quality: string) {
         frog.quality = quality
      }
   })

   const $frogName = ion(() => frog.name, {
      set: frog.setName
   })


   return component(
      <>
         <h3>True prop ion</h3>
         <div>{$=frog.name}</div>
         <h3>Writable Derived "Prop ion"</h3>
         <div>{$frogName}</div>
         <button on:click={e => $frogName.set($frogName() + '!')}>shout name via writable method</button>
         <button on:click={e => frog.setName(frog.name + '?')}>question name via ionized model method</button>
      </>
   )
}