// FB chat app
// [] increment unseen thread count
// [] append message in chat tab
// [] if open, append message in main messages view
// [] if chat tab is focused or main messages view is open, decrement unseen count

import { component, fromTag, NodeEntity, ref, v } from "@rue/lumo";
import { MorphicNode as Morphable } from "../../../../packages/lumo/src/conditional/MorphicNode";
import { finiton, ion } from "@rue/quarky";

// data
type User = {
   id: string
   threads: ThreadID[]
}

type Contact = {
   id: ContactID
   name: string
}

type ContactID = string
type ThreadID = string
type MessageID = string

type ThreadData = {
   id: string
   to: ContactID[]
   messages: MessageID[]
   newMessages: MessageID[]
}

type MessageData = {
   id: string
   text: string
   date: string
}

// Models

class Message {
   constructor(
      public id: string,
      public text: string,
      public date: string
   ){}
}

class Thread {
   constructor(
      id: string,
      to: ContactID[],
      messages: Message[],
      newMessages: Message[]
   ){   }

   hasNewMessages(){
      return Boolean(this.hasNewMessages.length)
   }
}

function reviveData(){

}


export function FBApp() {

   
   listen('new-messages', (data)=>{
      data.newMessages
   })
   const $mainContent = ref($Main)

   const $unseenCount = ion(0, {
      increment(count: number = 1) {
         $unseenCount.state = $unseenCount() + count
      },
      decrement(count: number = 1) {
         $unseenCount.state = $unseenCount() - count
      }
   })

   const $chatPopup = finiton('closed', {
      'closed': {
         open: () => 'opened'
      },
      'opened': {
         close: () => 'closed'
      }
   })

   const $chatPopupFocus = finiton('focused', {
      'focused': {
         unfocus: () => 'unfocused'
      },
      'unfocused': {
         focus: () => 'focused'
      }
   })

   $chatPopup.nest({
      'open': [$chatPopupFocus]
   })

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

function Button(input = fromTag({
   children: v<any>
})) {
   return component(
      <button>

      </button>
   )
}

function NavBar() {
   return component(
      <div></div>
   )
}

function ChatPopup() {
   return component(
      <div></div>
   )
}
function Home() {
   return component(
      <div></div>
   )
}

function Chat() {
   return component(
      <div></div>
   )
}

function ThreadList(){
   return component(
      <>
      </>
   )
}
function MessageThread(){
   return component(
      <>
      </>
   )
}



