import { component, If, Style } from "@rue/lumo";
import { Router } from "./router";
import { Ion, ion } from "@rue/quarky";
import { User } from "./commons/keys";
import { WelcomeView } from "./components/WelcomeView";
import { Chatroom } from "./components/Chatroom";
import { initDatabaseConnection, onLoggedIn, onLoggedOut } from "./database/database";

//TODO: Figure out how to provide user

// [ ] tabs to open chat window while logged in
// [ ] new messages notification
// [ ] optimistic updates

export function ChatApp() {
   const $connected = initDatabaseConnection();
   const $user = ion(null as User | null)
   let initialLoad = true;

   const { $View, $route, routeTo } = Router([
      ['/', () => {
         const user = $user()
         if (user) {
            routeTo('/chat')
            return;
         }
         return <WelcomeView initialLoad={initialLoad}></WelcomeView>
      }],
      ['/chat', () => {
         const user = $user()
         if (!user) {
            routeTo('/')
            return;
         }
         return <Chatroom user={$user()!}></Chatroom> //TODO: non-null assertion
      }],
   ])

   onLoggedIn(user => {
      $user.state = user
      routeTo('/chat')
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

