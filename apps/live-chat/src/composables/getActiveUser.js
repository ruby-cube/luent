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



// import { ref } from 'vue'
// import { projectAuth } from '../firebase/config'

// // refs
// const user = ref(projectAuth.currentUser)

// // listen for auth changes outside of function
// // so only 1 listener is ever attached
// projectAuth.onAuthStateChanged(_user => {
//   console.log('User state change. Current user is:', _user)
//   user.value = _user
// });

// const getUser = () => {
//   return { user } 
// }

// export default getUser