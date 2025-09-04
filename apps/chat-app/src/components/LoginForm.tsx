import { component, FromTag } from '@rue/lumo'
import { ion } from '@rue/quarky'
import { logIn } from '../database/database'


export function LoginForm() {
   
   const $email = ion('')
   const $password = ion('')
   const $error = ion('')

   async function reSubmit(e: any) {
      e.preventDefault();
      const response = await logIn($email(), $password())
      if (response.error)
         $error.state = response.error
   }

   return component(
      <form on:submit={reSubmit}>
         <input type="email" required placeholder="email" mu:value={$email}></input>
         <input type="password" required placeholder="password" mu:value={$password}></input>
         <div class="error">{$error}</div>
         <button>Log in</button>
      </form>
   )
}

