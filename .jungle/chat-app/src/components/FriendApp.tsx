//@ts-nocheck
import { component, Context, template, fromRoot, fromContext, If, Polymorph } from "@rue/luent";
import { USER, User } from "../context/keys";
import { Chatroom } from "./Chatroom";
import { Navbar } from "./Navbar";

export function FriendApp(input: {
   user: User
}) {
   const { user } = input

   const $App = Polymorph([
      ['home', () => (
         <div>Welcome home 🏠</div>
      )],
      ['chat', () => (
         <Chatroom user={user}></Chatroom>
      )]
   ], { preserve: true })

   const $main = $App.Morphable('home')

   return component(
      <o:context provide={[USER(user)]}>
         <Navbar user={user} navigateHome={() => $main.as('home')}>
            <button on:click={() => $main.as('chat')}>Chat</button>
         </Navbar>
         <$App as={$main}></$App>
      </o:context>
   )
}