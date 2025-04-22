//@ts-nocheck
import { NodeRef, Try, } from "@rue/lumo";
import { DerivedIon, watchEffect, ion, ionize } from "@rue/quarky";


//tests:
//- reactivity of nested object

export function TestBox() {

   const box$ = ionize({
      position: {
         x: 0,
         y: 0
      }
   })


   function moveRight() {
      box$.position.x = box$.position.x + 10;
   }

   function moveLeft() {
      box$.position.x = box$.position.x - 10;
   }

   const $div = NodeRef('div')


   return (
      <>
         <div ref={$div} style={{
            backgroundColor: 'lightgray',
            transform: (`translate(${box$.position.x}px)`)
         }}>I'm a box</div>
         <button on:click={moveLeft}>moveLeft</button>
         <button on:click={moveRight}>moveRight</button>
      </>
   )
}

