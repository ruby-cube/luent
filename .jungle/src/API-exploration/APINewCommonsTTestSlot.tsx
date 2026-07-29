//@ts-nocheck
import { component, Context, ContextKey, template, fromContext, FromTag, RenderSlot } from "luent";
import { ArticleDatabase } from "../wip-demos/conduit/src/db/ArticleDatabase";

// # via context

function Parent() {
   return (

      <div>
         <o:context provide={[
            Content['something'](new Something()),
            ArticleView['mu:db'](new ArticleDatabase())
         ]}>
            <Button Nested={Nested}>
               <Content></Content>
            </Button>
         </o:context>
      </div >
   )
}

const Nested = {
   'something': mergeKeys(
      Content['something'],
      Deeper['something']
   )
}

//--

Content['something'] = ContextKey<string>()

function Content() {
   const something = fromContext(Content['something'])

   return (

      <div>hi</div>
   )
}


//--

export function Button(input: {
   Slot: RenderSlot,
   Nested: { something: ContextKey<string> }
}) {
   const { Slot, Nested } = input

   return (

      <div>
         <o:context provide={[Nested['something']('hello')]}>
            {Slot}
         </o:context>
      </div>
   )
}




// # via slot input

function ParentB() {
   return (

      <div>
         <ButtonB>{something =>
            <ContentB something={something}></ContentB>
         }</ButtonB>
      </div>
   )
}



//--

ContentB['something'] = ContextKey<string>()

function ContentB(input: { something?: string }) {
   const { something = fromContext(Content['something']) } = input

   return (

      <div>hi</div>
   )
}


//--

export function ButtonB(input: {
   Slot: RenderSlot<string>,
}) {
   const { Slot } = input

   return (

      <div>
         {Slot('hi')}
      </div>
   )
}
