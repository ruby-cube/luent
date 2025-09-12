//@ts--nocheck
import { Commons, component, fromApp, fromCommons, FromTag, If, Polymorph } from "@rue/lumo";
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

   const $openedApp = $App.Morphable('home')

   return component(
      <Commons provide={[USER(user)]}>
            <Navbar user={user} can:navigateHome={() => $openedApp.as('home')}>
               <button on:click={() => $openedApp.as('chat')}>Chat</button>
            </Navbar>
            <$App as={$openedApp}></$App>
      </Commons>
   )
}