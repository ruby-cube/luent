//@ts-nocheck
import { ion } from '@rue/quarky'
import { LoginKit } from '../composables/useLoginKit'
import { component, fromTag, InputType, v } from '@rue/lumo'

const LOGIN_FORM = InputType({
   'on:login': v<Function>
})

export function LoginForm({
   emit
} = fromTag(LOGIN_FORM)) {

   const $email = ion('')
   const $password = ion('')

   const { $error, login } = LoginKit()

   const handleSubmit = async () => {
      await login($email.value, $password.value)
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