//@ts-nocheck
import { component, NodeRef } from "@rue/lumo";
import { MorphicNode } from "../../../packages/lumo/src/morphic/MorphicNode";

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

   return component(
      <>
         <$Morphable as='hi' ref={$morphicNode}></$Morphable>

         <i--i>do something</i--i>

         <$--suspense>
            <Something />
         </$--suspense>

         <$--try>

         </$--try>

         <$--portal>

         </$--portal>

         <$--transition>
            <$--swap display />
            {If($active,
               <p>hey</p>
            )}
         </$--transition>

         <$--client hydrate>
            <button on:click={() => morph('hi')}>change to hi</button>
            <button on:click={() => morph('bye')}>change to bye</button>
         </$--client>
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

