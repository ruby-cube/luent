//@ts-nocheck
import { component, FromTag, v } from "@rue/lumo"
import { Ion, watch } from "@rue/quarky"
import { DynamicNode } from "../../../../packages/lumo/src/flask/ViewFlask";

/**
 * [] Should asynchronous functions be bound to their contexts? ... It's a lot of work... leaning towards no..
 * [] Should watchers be auto stopped when its containing flask is disposed? How about nested watchers? Should this be the case for all flasked listeners?
 * [] If auto-disposal is implemented, what is the best way to detach a watcher from its containing flask? Should watchers inherently be flasks? 
 */

function $thisNode() { return {} as ThisNode }

function TestingStuff(
   input : FromTag<{
      frog: Frog
   }>()
) {
   const { fromCoop, onDismantle } = $thisNode();
   const { frog } = input;

   const { $count } = CounterKit($thisNode())

   const $songBird = Ion('')

   onDismantle(() => {
      $songBird.value = fromCoop(_song_bird_)

   })

   return component(
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

   const $count = Ion(0)

   //@ts-ignore
   watch($count, e => {

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
function Component() {

   return component(
      <>
         {($condition: Ion<boolean>, dynamicNode: DynamicNode) => (
            dynamicNode = new DynamicNode(null),

            // render 
            watch(style, () => {
               watch(ion, () => {

               }) // should be replaced when effect is rerun
            }),


            watch($condition, () => {
               // render 
               watch(style, () => {
                  watch(ion, () => {

                  }) // should be replaced when effect is rerun
               }) //should stop when kit's dynamic node is dismantled, which is also when the effect is dismantled; should pause if kit is deactivated, effect cannot be deactivated..
            }) // stops when outer dynamic node is dismantled
         )}

         {() => (
            // render 
            watch(style, () => {
               watch(ion, () => {

               }) // should be replaced when effect is rerun
            }),

            watch(list, () => {

               // render 
               watch(style, () => {
                  watch(ion, () => {

                  }) // until: outer effect
               }) // until: dynamic node

               watch(ion, () => {

               }) // until: dynamic node

            })
         )}
      </>
   )
}