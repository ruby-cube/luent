//@ts-nocheck
import { component, template, v } from "luent"
import { Ion, observe } from "@luent/quarky"
import { DynamicNode } from "../../../../packagesluent/src/flask/ViewFlask";

/**
 * [] Should asynchronous functions be bound to their contexts? ... It's a lot of work... leaning towards no..
 * [] Should watchers be auto stopped when its containing flask is disposed? How about nested watchers? Should this be the case for all flasked listeners?
 * [] If auto-disposal is implemented, what is the best way to detach a observer from its containing flask? Should watchers inherently be flasks? 
 */

function $thisNode() { return {} as ThisNode }

function TestingStuff(
   input : {
      frog: Frog
   }()
) {
   const { fromCoop, onDismantle } = $thisNode();
   const { frog } = input;

   const { $count } = CounterKit($thisNode())

   const $songBird = ion('')

   onDismantle(() => {
      $songBird.value = fromCoop(_song_bird_)

   })

   return (

      <>
         <div>{$songBird}</div>
         <p>hi</p>
      </>
   )
}

function doSomething(context: ThisNode) {
   const { fromCoop } = context;
   const rattlesnake = fromCoop('rattlesnake')
}

function CounterKit(context: ThisNode) {

   const $count = ion(0)

   //@ts-ignore
   observe($count, e => {

   }, {})

   return {
      $count
   }
}

const _song_bird_ = ''


type ThisNode = {
   outer: ThisNode;
   fromCoop: (key: any) => any
   onDismantle: (task: () => void) => void
}

const outerDynamicNode: DynamicNode
function component() {

   return (

      <>
         {($condition: Ion<boolean>, dynamicNode: DynamicNode) => (
            dynamicNode = new DynamicNode(null),

            // render 
            observe(style, () => {
               observe(ion, () => {

               }) // should be replaced when effect is rerun
            }),


            observe($condition, () => {
               // render 
               observe(style, () => {
                  observe(ion, () => {

                  }) // should be replaced when effect is rerun
               }) //should stop when kit's dynamic node is dismantled, which is also when the effect is dismantled; should pause if kit is deactivated, effect cannot be deactivated..
            }) // stops when outer dynamic node is dismantled
         )}

         {() => (
            // render 
            observe(style, () => {
               observe(ion, () => {

               }) // should be replaced when effect is rerun
            }),

            observe(list, () => {

               // render 
               observe(style, () => {
                  observe(ion, () => {

                  }) // until: outer effect
               }) // until: dynamic node

               observe(ion, () => {

               }) // until: dynamic node

            })
         )}
      </>
   )
}