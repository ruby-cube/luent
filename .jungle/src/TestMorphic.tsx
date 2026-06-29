//@ts-nocheck
import { component, template, NodeRef } from "@rue/luent";
import { MorphicNode } from "../../../packages/luent/src/morphic/MorphicNode";

export function TestMorphic() {

   const $Morphable = MorphicNode({
      hi: () =>
         <div>hello</div>
      ,
      bye: () =>
         <div>bye</div>
   })

   const $morphicNode = NodeRef($Morphable)
   const $comment = NodeRef(CommentBlock)

   function morph(key: string) {
      // console.log("$morphic node", $morphicNode)
      $morphicNode()!.as(key)
   }

   return (

      <>
         <$Morphable as='hi' ref={$morphicNode}></$Morphable>

         <i--i>do something</i--i>

         <o--suspense>
            <Something />
         </o--suspense>

         <o--try>

         </o--try>

         <o--portal>

         </o--portal>

         <Transition>
            {If($active,
               <p>hey</p>
            )}
         </Transition>

         <o--client hydrate>
            <button on:click={() => morph('hi')}>change to hi</button>
            <button on:click={() => morph('bye')}>change to bye</button>
         </o--client>
      </>
   )
}

function CommentBlock(setup: {
   blue: string
}) {
   return component({
      frog: true
   },
      <div>blah</div>
   )
}

