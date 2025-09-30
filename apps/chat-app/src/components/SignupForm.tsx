import { component } from '@rue/lumo'
import { ion } from '@rue/quarky'
import { signUp } from '../database/database'

export function SignupForm() {

   const $username = ion('')
   const $email = ion('')
   const $password = ion('')
   const $error = ion('')

   async function reSubmit(e: any) {
      e.preventDefault();
      const response = await signUp($email(), $password(), $username())
      if (response.error)
         $error.value = response.error
   }

   return component(
      <form on:submit={e => reSubmit(e)}>
         <input type="text" required placeholder="username" mu:value={$username}></input>
         <input type="email" required placeholder="email" mu:value={$email}></input>
         <input type="password" required placeholder="password" mu:value={$password}></input>
         <div class="error">{$error}</div>
         <button>Sign up</button>
      </form>
   )
}