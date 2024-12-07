//@ts-nocheck
import { Component, expose, fromTag, prep } from "@rue/lumo";
import { ion } from "@rue/quarky";
import { Article } from "./TestCustomCleanupScheduler";


// only want to expose increment


// $selected ... implementation is hidden by abstraction of an invisible aggregate state capsule


// OPTION A:
// - only bundle public methods with ion
// - write private methods as functions
// - pass down

// OPTION B:
// - bundle all methods in ion
// - select methods to expose
// - pass down

// OPTION C:
// - don't bundle methods
// - pass methods separately




function ListA() {

   const $count = ion(0, {
      incrementXPO() { /*public*/
         $count.as($count() + 1)
      },

      decrement() { /*public*/
         $count.as($count() - 1)
      }
   })

   const selection$ = ionize({
      target: { name: '' }
   }, {
      setTarget() {
         selection$.target = { name: 'something' }
      }
   })

   // extract absorbed ion or readonly ion
   // destructure absorbed ions or readonly ions
   // extract ion and transfer methods from ionized model

   // const $target = selection$.$('target', { setTarget: 'set' })

   // const $target = selection$.$('target')

   // const $target = selection$.ion('target', { setTarget: 'set' })

   // const $target = selection$.ion('target')

   const { $target } = ionsOf(selection$)

   // const { $target } = ions(selection$)

   const $target = ionOf(selection$, 'target', { 
      setTarget: 'set' 
   })

   const $target = ionsOf(selection$).$target

   const $target = $(selection$).$target

   watch(selection$.$('target'), () => {

   })

   watch(selection$.x$target, () => {

   })

   const dog$ = {
      '~$collar': 0,
   }

   dog$["~$collar"]


   watch(selection$["~$target"], () => {

   })

   watch(selection$.ion('target'), () => {

   })

   watch(x$(selection$).$target, () => {

   })

   // watch(ions(selection$).$target, () => {

   // })

   watch(ionsOf(selection$).$target, () => {

   })

   const $target = ion.of(selection$, 'target')


   const $target = selection$.ionOf('target', { setTarget: 'set' })

   const $target = ion.of(selection$, '$target', { setTarget: 'set' })

   

   return Component(
      {
         incrementCount: $count.increment
      },
      <>
         <h1>Hello World</h1>

         <p>{$count}</p>
         <button on:click={$count.increment}>increment</button>

         <Item count={$count} />
         <Item $count={exo($count, 'increment')} ref={dog$.$collar} $selection={exo(selection$, 'setTarget')} />
         <Context with={{ [COUNT]: $count }}> {/* non-explicit exposure by type; vulnerable decrement function */}
            <Article />
            <Footer />
         </Context>
      </>
   )
}


function List() {

   const $count = ion(0)

   function incrementCount() {
      $count.as($count() + 1)
   }

   function decrementCount() {
      $count.as($count() - 1)
   }


   return Component(
      {
         incrementCount
      },
      <>
         <h1>Hello World</h1>

         <p>{$count}</p>
         <button on:click={incrementCount}>increment</button>

         <Item countKit={{ $count, incrementCount }} /> {/* expose to child; explicit bundling*/}
         {/* // <Item $count={$count} incrementCount={incrementCount} /> {/* expose to child; explicit bundling*/}
            // <Item $count={exo($count, 'increment', 'decrement')} /> {/* expose to child; explicit bundling*/}
            // <Context provide={w(COUNT, $count)}> {/* non-explicit exposure by type; vulnerable decrement function */}
            //     <Article />
            //     <Footer />
            // </Context>
      </>

   )
}

function Item(
   input = fromTag({
      countKit: v<{ $count: Ion<number>; incrementCount: () => void }>
   })
) {

}