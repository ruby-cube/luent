import { useRealtimeDB } from '../firebase/useRealtimeDB'

export const useActiveUserKit = asSharedKit(ActiveUserKit)

function ActiveUserKit() {
   const { projectAuth } = useRealtimeDB()

   // listen for auth changes outside of function
   // so only 1 listener is ever attached
   projectAuth.onAuthStateChanged(user => {
      console.log('User state change. Current user is:', user)
      this.activeUser = user
   });

   return { activeUser: projectAuth }
}