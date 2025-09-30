import { component, fromGlobal, If, Style } from "@rue/lumo";
import { Router } from "./router";
import { Ion, ion, Ionized } from "@rue/quarky";
import { User } from "./commons/keys";
import { WelcomeView } from "./components/WelcomeView";
import { Chatroom } from "./components/Chatroom";
import { initDatabaseConnection, onLoggedIn, onLoggedOut } from "./database/database";
import { FriendApp } from "./components/FriendApp";
import { getClosestCommons } from "../../../packages/lumo/src/commons/commons-stack";

//TODO: Figure out how to provide user

// [ ] tabs to open chat window while logged in
// [ ] new messages notification
// [ ] optimistic updates

export function FriendSite() {
   const $connected = initDatabaseConnection();
   const $user = ion(null as User | null)
   let initialLoad = true;

   const { $View, $route, routeTo } = Router([
      ['/', () => {
         const user = $user()
         if (user) {
            routeTo('/app')
            return;
         }
         return <WelcomeView initialLoad={initialLoad}></WelcomeView>
      }],
      ['/app', () => {
         const user = $user()
         if (!user) {
            routeTo('/')
            return;
         }
         return <FriendApp user={user}></FriendApp> //TODO: non-null assertion
      }],
   ])

   onLoggedIn(user => {
      $user.value = user
      routeTo('/app')
      initialLoad = false
   })

   onLoggedOut(() => {
      routeTo('/')
      $user.value = null
   })

   return component(
      <>
         {If($connected,
            <$View as={$route}></$View>
         )}

         {Style`
            #app {
              font-family: Avenir, Helvetica, Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
         `}
      </>
   )
}

