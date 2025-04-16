// FB chat app
// [] increment unseen thread count
// [] append message in chat tab
// [] if open, append message in main messages view
// [] if chat tab is focused or main messages view is open, decrement unseen count

import { component, ref } from "@rue/lumo";
import { MorphicNode as Morphable } from "../../../../packages/lumo/src/conditional/MorphicNode";


export function FBApp() {
   const $mainContent = ref($Main)

   return component(
      <>
         <NavBar></NavBar>
         <main>
            <$Main as='home' ref={$mainContent}></$Main>
         </main>
         <ChatPopup></ChatPopup>
      </>
   )
}

const $Main = Morphable({
   home: () =>
      <Home></Home>
   ,
   chat: () =>
      <Chat></Chat>
})

function NavBar() {
   return component(
      <div></div>
   )
}

function ChatPopup(){
   return component(
      <div></div>
   )
}
function Home() {
   return component(
      <div></div>
   )
}

function Chat(){
   return component(
      <div></div>
   )
}



