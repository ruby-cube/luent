import { component, FromTag } from '@rue/lumo'
import { Ion } from '@rue/quarky'
import { logIn } from '../database/database'


export function LoginForm() {
   
   const $email = Ion('')
   const $password = Ion('')
   const $error = Ion('')

   async function reSubmit(e: any) {
      e.preventDefault();
      const response = await logIn($email(), $password())
      if (response.error)
         $error.value = response.error
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

