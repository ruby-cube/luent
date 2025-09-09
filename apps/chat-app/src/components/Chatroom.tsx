import { component, FromTag, startDebugger } from "@rue/lumo";
import { Navbar } from "./Navbar";
import { User } from '../commons/keys'
import { ChatWindow } from "./ChatWindow";
import { MessageForm } from "./MessageForm";
import { ChatMessagesKit } from "../database/database";



export function Chatroom(input: FromTag<{
   user: User
}>) {
   const { user } = input

   const {$error, $messages, postChatMessage} = ChatMessagesKit()

   return component(
      <div class="container">
         <Navbar user={user} />
         <ChatWindow error={$error} messages={$messages} user={user} />
         <MessageForm user={user} can:postMessage={postChatMessage} />
         <button on:click={startDebugger}>debug</button>
      </div>
   )
}