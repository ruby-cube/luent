//@ts-nocheck
import { Commons, component, fromApp, fromContext, FromTag, If, Polymorph } from "@rue/lumo";
import { USER, User } from "../commons/keys";
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

   return component(
      <Context provide={[USER(user)]}>
         <Navbar user={user} use:navigateHome={() => $main.as('home')}>
            <button on:click={() => $main.as('chat')}>Chat</button>
         </Navbar>
         <$App as={$main}></$App>
      </Context>
   )
}