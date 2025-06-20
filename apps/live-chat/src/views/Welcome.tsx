//@ts-nocheck
import { SignupForm } from '../components/SignupForm.vue'
import { LoginForm } from '../components/LoginForm.tsx'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { component, Else, If } from '@rue/lumo'
import { ion } from '@rue/quarky'

function Welcome() {
   const $activeView = ion('login')

   const showLogin = () => {
      $activeView.value = 'login'
   }

   const showSignup = () => {
      $activeView.value = 'signup'
   }

   const router = useRouter()

   const enterChat = () => {
      router.navigate('Chatroom')
   }

   return component(
      <div class="welcome container">
         {If($activeView.value === 'login',
            <div>
               <h2>Login</h2>
               <LoginForm on:login={enterChat} />
               <p>No account yet? <span on:click={showSignup}>Signup</span> instead.</p>
            </div>
         )}
         {Else(
            <div>
               <h2>Sign up</h2>
               <SignupForm on:signup={enterChat} />
               <p>Already registered? <span on:click={showLogin}>Login</span> instead.</p>
            </div >
         )}


         <o--style>{`
         .welcome {
            text - align: center;
         padding: 20px 0;
  }
         /* form styles */
         .welcome form {
            width: 300px;
         margin: 20px auto;
  }
         .welcome label {
            display: block;
         margin: 20px 0 10px;
  }
         .welcome input {
            width: 100%;
         padding: 10px;
         border-radius: 20px;
         border: 1px solid #eee;
         outline: none;
         color: #999;
         margin: 10px auto;
  }
         .welcome span{
            font - weight: bold;
         text-decoration: underline;
         cursor: pointer;
  }
         .welcome button {
            margin: 20px auto;
  }
      `}</o--style>
      </div >
   )
}

