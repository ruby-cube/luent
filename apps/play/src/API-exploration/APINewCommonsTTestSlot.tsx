//@ts-nocheck
import { Context, ContextKey, template, fromContext, FromTag, RenderSlot } from "@rue/luent";
import { ArticleDatabase } from "../wip-demos/conduit/src/db/ArticleDatabase";

// # via context

function Parent() {
   return template(
      <div>
         <Context provide={[
            Content['something'](new Something()),
            ArticleView['mu:db'](new ArticleDatabase())
         ]}>
            <Button Nested={Nested}>
               <Content></Content>
            </Button>
         </Context>
      </div >
   )
}

const Nested = {
   'something': mergeContextKeys(
      Content['something'],
      Deeper['something']
   )
}

//--

Content['something'] = ContextKey<string>()

function Content() {
   const something = fromContext(Content['something'])

   return template(
      <div>hi</div>
   )
}


//--

export function Button(input: FromTag<{
   Slot: RenderSlot,
   Nested: { something: ContextKey<string> }
}>) {
   const { Slot, Nested } = input

   return template(
      <div>
         <Context provide={[Nested['something']('hello')]}>
            {Slot}
         </Context>
      </div>
   )
}




// # via slot input

function ParentB() {
   return template(
      <div>
         <ButtonB>{something =>
            <ContentB something={something}></ContentB>
         }</ButtonB>
      </div>
   )
}



//--

ContentB['something'] = ContextKey<string>()

function ContentB(input: FromTag<{ something?: string }>) {
   const { something = fromContext(Content['something']) } = input

   return template(
      <div>hi</div>
   )
}


//--

export function ButtonB(input: FromTag<{
   Slot: RenderSlot<string>,
}>) {
   const { Slot } = input

   return template(
      <div>
         {Slot('hi')}
      </div>
   )
}
