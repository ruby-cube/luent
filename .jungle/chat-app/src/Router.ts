import { Router } from "./router";

declare global {
   type Router = typeof router
}


const router = Router([
   ['/', () => {
      const user = $user()
      if (user) {
         routeTo('/app')
         return;
      }
      return <WelcomeView initialLoad={ initialLoad }> </WelcomeView>
   }],
   ['/app', () => {
      const user = $user()
      if (!user) {
         routeTo('/')
         return;
      }
      return <FriendApp user={ user }> </FriendApp> / / TODO: non - null assertion
   }],
])