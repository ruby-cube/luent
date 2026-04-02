//@ts-nocheck
import { Context, template, fromRoot, fromContext, FromTag, If, Polymorph } from "@rue/luent";
import { USER, User } from "../context/keys";
import { Chatroom } from "./Chatroom";
import { Navbar } from "./Navbar";

export function FriendApp(input: FromTag<{
   user: User
}>) {
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

   return template(
      <Context provide={[USER(user)]}>
         <Navbar user={user} navigateHome={() => $main.as('home')}>
            <button on:click={() => $main.as('chat')}>Chat</button>
         </Navbar>
         <$App as={$main}></$App>
      </Context>
   )
}