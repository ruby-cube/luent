//@ts-nocheck
import { component, GetNode } from "@rue/lumo";
import { MorphicNode } from "../../../packages/lumo/src/morphic/MorphicNode";

export function TestMorphic() {

   const $Morphable = MorphicNode({
      hi: () =>
         <div>hello</div>
      ,
      bye: () =>
         <div>bye</div>
   })

   const $morphicNode = GetNode($Morphable)
   const $comment = GetNode(CommentBlock)

   function morph(key: string) {
      // console.log("$morphic node", $morphicNode)
      $morphicNode()!.as(key)
   }

   return component(
      <>
         <$Morphable as='hi' node={$morphicNode}></$Morphable>

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

