import { component, template, fromContext, FromTag } from "@rue/luent";
import { USER, User } from '../context/keys'
import { ChatWindow } from "./ChatWindow";
import { MessageForm } from "./MessageForm";
import { ChatKit } from "../database/database";



export function Chatroom(input: FromTag<{
   user: User
}>) {
   const { user } = input
   // const user = fromContext(USER)

   const chatKit = ChatKit()

   return component(
      <div class="container">
         <ChatWindow user={user} chat={chatKit} />
         <MessageForm user={user} postMessage={chatKit.postChatMessage} />
         {/* <button on:click={startDebugger}>debug</button> */}
      </div>
   )
}