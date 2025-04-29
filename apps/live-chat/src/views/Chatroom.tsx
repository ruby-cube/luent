//@ts-nocheck
import NewChatForm from '../components/NewChatForm.vue'
import ChatWindow from '../components/ChatWindow.vue'
import Navbar from '../components/Navbar.vue'
import { getUser } from '.'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { component } from '@rue/lumo'


export function Chatroom() {
   const router = useRouter()
   const $user = getUser()

   // if the user value is ever null, redirect to welcome screen
   watch($user, ({ current: user }) => {
      if (!user) {
         router.navigate('Welcome')
      }
   })

   return component(
      <div class="container">
         <Navbar />
         <ChatWindow />
         <NewChatForm />
      </div>
   )
}
