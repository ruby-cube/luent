import { component, template, fromGround, fromRoot, If, Style, css } from "luent";
import { Ion, ion } from "@luent/quarky";
import { User } from "./context/keys";
import { initDatabaseConnection, onLoggedIn, onLoggedOut } from "./database/database";

// TODO: Figure out how to provide user

// [ ] tabs to open chat window while logged in
// [ ] new messages notification
// [ ] optimistic updates

export function FriendSite() {
   const $connected = initDatabaseConnection();
   const $user = ion(null as User | null)
   let initialLoad = true;
   const $route = getRouter()

   onLoggedIn(user => {
      $user.value = user
      $route.to('app')
      initialLoad = false
   })

   onLoggedOut(() => {
      $route.to('default')
      $user.value = null
   })

   return (

      <>
         {If($connected,
            <RouteView as={$route}></RouteView>
         )}
         {Style(css`
            #app {
               font-family: Avenir, Helvetica, Arial, sans-serif;
               -webkit-font-smoothing: antialiased;
               -moz-osx-font-smoothing: grayscale;
            }
         `)}
      </>
   )
}


