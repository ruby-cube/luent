import { $thisView, component, Else, If } from "@rue/lumo";
import { getCurrentPhase, ion, watch } from "@rue/quarky";
import { $thisScene } from "../../../packages/flask/Scene";

let rootView: any;

export function TestViewFlasks() {
   const view = rootView = $thisView()
   console.log('>>> this view root', view)

   const $active = ion(true, {
      toggle() { $active.state = !$active() }
   })

   return component(
      <>
         <div>hallo</div>
         <Parent></Parent>
         <button on:click={e => $active.toggle()}>toggle active</button>
         {If($active,
            <DynamicParent />
         )}
      </>
   )
}

function Parent() {
   const view = $thisView()
   console.log('>>> this view parent', view, rootView === view)

   return component(
      <div>parent</div>
   )
}

let dynamicParentView: any;

function DynamicParent() {

   const $active = ion(true, {
      toggle() { $active.state = !$active() }
   })

   const $happy = ion(true, {
      toggle() { $happy.state = !$happy() }
   })

   const view = dynamicParentView = $thisView()
   console.log('>>> this view dynamic parent', view, rootView !== view)

   watch($active, () => {
      const scene = $thisScene()
      console.log('>>> dynamic parent effect', scene, getCurrentPhase())
      watch($happy, () => {
         const scene = $thisScene()
         console.log('>>> happy effect', scene, getCurrentPhase())
      }, { eager: true })
   }, { eager: true })

   return component(
      <>
         <div>dynamic parent</div>
         <button on:click={e => $active.toggle()}>toggle active</button>
         {If($active,
            'one'
            // <DynamicChild />
         )}
         {Else(
            <>
               other
               {/* <DynamicChild /> */}
            </>
         )}
         <button on:click={e => $happy.toggle()}>toggle happy</button>
         <div>happy: {$happy}</div>
      </>)
}

function DynamicChild() {
   const view = $thisView()
   // console.log('>>> this view dynamic child', view)

   return component(
      <div>dynamic child</div>
   )
}
