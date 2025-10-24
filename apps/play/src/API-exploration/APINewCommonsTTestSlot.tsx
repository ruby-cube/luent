//@ts-nocheck
import { Commons, HubKey, component, fromHub, FromTag, RenderSlot } from "@rue/lumo";
import { ArticleDatabase } from "../demos/conduit/src/db/ArticleDatabase";

// # via commons

function Parent() {
   return component(
      <div>
         <Commons provide={[
            Content['something'](new Something()),
            ArticleView['mu:db'](new ArticleDatabase())
         ]}>
            <Button Nested={Nested}>
               <Content></Content>
            </Button>
         </Commons>
      </div >
   )
}

const Nested = {
   'something': mergeNubKeys(
      Content['something'],
      Deeper['something']
   )
}

//--

Content['something'] = HubKey<string>()

function Content() {
   const something = fromHub(Content['something'])

   return component(
      <div>hi</div>
   )
}


//--

export function Button(input: FromTag<{
   Slot: RenderSlot,
   Nested: { something: HubKey<string> }
}>) {
   const { Slot, Nested } = input

   return component(
      <div>
         <Commons provide={[Nested['something']('hello')]}>
            {Slot()}
         </Commons>
      </div>
   )
}




// # via slot input

function ParentB() {
   return component(
      <div>
         <ButtonB>{something =>
            <ContentB something={something}></ContentB>
         }</ButtonB>
      </div>
   )
}



//--

ContentB['something'] = HubKey<string>()

function ContentB(input: FromTag<{ something?: string }>) {
   const { something = fromHub(Content['something']) } = input

   return component(
      <div>hi</div>
   )
}


//--

export function ButtonB(input: FromTag<{
   Slot: RenderSlot<string>,
}>) {
   const { Slot } = input

   return component(
      <div>
         {Slot('hi')}
      </div>
   )
}
