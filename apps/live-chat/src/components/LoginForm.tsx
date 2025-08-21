import { ion } from '@rue/quarky'
import { LoginKit } from '../composables/useLoginKit'
import { component, HandleEvent, FromTag } from '@rue/lumo'

type Som = HandleEvent
export function LoginForm({
   emit
} : FromTag<{
   'on:login': HandleEvent
}>) {

   const $email = ion('')
   const $password = ion('')

   const { $error, login } = LoginKit()

   const handleSubmit = async () => {
      await login($email(), $password())
      if (!$error.value) {
         emit('login')
      }
   }

   return component(
      <form on:submit={e => (e.preventDefault(), handleSubmit)}>
         <input type="email" required placeholder="email" mu:value={$email} />
         <input type="password" required placeholder="password" mu:value={$password} />
         <div class="error">{$error}</div>
         <button>Log in</button>
      </form>
   )
}