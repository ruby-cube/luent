// FB chat app
// [] increment unseen thread count
// [] append message in chat tab
// [] if open, append message in main messages view
// [] if chat tab is focused or main messages view is open, decrement unseen count

import { template, FromTag, NodeRef, Slot } from "@rue/luent";
import { MorphicNode as Polymorph } from "../../../../packages/luent/src/conditional/x_Polymorph";
import { Finitron, finiton, ion } from "@rue/quarky";

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
   id: number
   text: string
   date: number
}

// Models

class Message {
   constructor(
      public id: string,
      public text: string = 'hello',
      public date: number = 0
   ) { }
}

class Thread {
   constructor(
      id: string,
      to: ContactID[],
      messages: Message[],
      newMessages: Message[]
   ) { }

   hasNewMessages() {
      return Boolean(this.hasNewMessages.length)
   }
}

type RealtimeData = {
}

function getRandomIntInclusive(min, max) {
   min = Math.ceil(min);
   max = Math.floor(max);
   return Math.floor(Math.random() * (max - min + 1) + min);
}

let _id = 0;

function watchDB(handler: (data: MessageData) => void) {
   const randomTimeout = getRandomIntInclusive(10000, 50000)
   setTimeout(() => {
      handler({
         id: _id++,
         text: 'hello',
         date: _id++
      })

      watchDB(handler)
   }, randomTimeout)
}




export function FBApp() {

   watchDB((data) => {
      data.newMessages
   })
   const $mainContent = NodeRef($Main)

   const $unseenCount = Ion(0, {
      increment(count: number = 1) {
         this.value = $unseenCount() + count
      },
      decrement(count: number = 1) {
         this.value = $unseenCount() - count
      }
   })

   const $chatPopup = Finitron({
      'closed': {
         open: () => 'opened'
      },
      'opened': {
         close: () => 'closed'
      }
   })

   const $popupFocus = finiton({
      'focused': {
         unfocus: () => 'unfocused'
      },
      'unfocused': {
         focus: () => 'focused'
      }
   })

   $chatPopup.activate(() => 'closed').nest({
      'open': [
         $popupFocus.init(() => 'unfocused')
      ]
   })

   function change(){
      $mainContent()?.as
   }

   const $main = $Main.varion('home')

   return template(
      <>
         <NavBar></NavBar>
         <main>
            <$Main as={$main}></$Main>
         </main>
         <ChatPopup></ChatPopup>
      </>
   )
}

const $Main = Polymorph({
   home: () =>
      <Home></Home>
   ,
   chat: () =>
      <Chat></Chat>
})

function Button(input : FromTag<{
   Slot: Slot
}>) {
   return template(
      <button>

      </button>
   )
}

function NavBar() {
   return template(
      <div></div>
   )
}

function ChatPopup() {
   return template(
      <div></div>
   )
}

function Home() {
   return template(
      <div></div>
   )
}

function Chat() {
   return template(
      <div></div>
   )
}

function ThreadList() {
   return template(
      <>
      </>
   )
}
function MessageThread() {
   return template(
      <>
      </>
   )
}



