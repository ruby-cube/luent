import { component, fromGlobal, fromRoot, If, Style } from "@rue/lumo";
import { Router } from "./router";
import { Ion, Ionized } from "@rue/quarky";
import { User } from "./commons/keys";
import { initDatabaseConnection, onLoggedIn, onLoggedOut } from "./database/database";

// TODO: Figure out how to provide user

// [ ] tabs to open chat window while logged in
// [ ] new messages notification
// [ ] optimistic updates

export function FriendSite() {
   const $connected = initDatabaseConnection();
   const $user = Ion(null as User | null)
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

   return component(
      <>
         {If($connected,
            <RouteView as={$route}></RouteView>
         )}
      </>
   )
      .css`
         #app {
           font-family: Avenir, Helvetica, Arial, sans-serif;
           -webkit-font-smoothing: antialiased;
           -moz-osx-font-smoothing: grayscale;
         }
      `
}


