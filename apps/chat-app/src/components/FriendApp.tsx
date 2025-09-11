//@ts--nocheck
import { Commons, component, FromTag, If, Polymorph } from "@rue/lumo";
import { USER, User } from "../commons/keys";
import { Chatroom } from "./Chatroom";
import { Navbar } from "./Navbar";
import { ion, Ion } from "@rue/quarky";

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

   const $active = ion(true)

   return component(
      <Commons provide={[USER(user)]}>
         <div>
            <Navbar user={user} can:navigateHome={() => $openedApp.as('home')}>
               <button on:click={() => $openedApp.as('chat')}>Chat</button>
            </Navbar>
            <$App as={$openedApp}></$App>
            {/* <Testing active={$active}></Testing> */}
         </div>
      </Commons>
   )
}

function Testing({ $active }: FromTag<{ 
   active: Ion<boolean> 
}>) {

   return component(
      <>
         {If($active,
            <div>hi</div>
         )}
      </>
   )
}