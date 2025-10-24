import { component, fromHub, FromTag } from "@rue/lumo";
import { USER, User } from '../commons/keys'
import { ChatWindow } from "./ChatWindow";
import { MessageForm } from "./MessageForm";
import { ChatKit } from "../database/database";



export function Chatroom(input: FromTag<{
   user: User
}>) {
   const { user } = input
   // const user = fromHub(USER)

   const chatKit = ChatKit()

   return component(
      <div class="container">
         <ChatWindow user={user} chat={chatKit} />
         <MessageForm user={user} use:postMessage={chatKit.postChatMessage} />
         {/* <button on:click={startDebugger}>debug</button> */}
      </div>
   )
}