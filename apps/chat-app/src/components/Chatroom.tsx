import { component, FromTag } from "@rue/lumo";
import { Navbar } from "./Navbar";
import { Ion } from "@rue/quarky";
import { User } from '../commons/keys'

export function Chatroom(input: FromTag<{
   user: Ion<User>
}>) {
   const { $user } = input

   return component(
      <>
         <div class="container">
            <Navbar user={$user} />
            Chatroom
            {/* <ChatWindow />
            <NewChatForm /> */}
         </div>
      </>
   )
}