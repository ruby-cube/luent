import { component, If, Style } from "@rue/lumo";
import { Router } from "./router";
import { Ion, ion } from "@rue/quarky";
import { User } from "./commons/keys";
import { WelcomeView } from "./components/WelcomeView";
import { Chatroom } from "./components/Chatroom";
import { initDatabaseConnection, onLoggedIn, onLoggedOut } from "./database/database";
import { FriendApp } from "./components/FriendApp";

//TODO: Figure out how to provide user

// [ ] tabs to open chat window while logged in
// [ ] new messages notification
// [ ] optimistic updates

export function FriendlyChatApp() {
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
      $user.state = user
      routeTo('/app')
      initialLoad = false
   })

   onLoggedOut(() => {
      routeTo('/')
      $user.state = null
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

