import { component, FromTag, If } from "@rue/lumo";
import { ion } from "@rue/quarky";
import { User } from "../commons/keys";
import { postChatMessage } from "../database/database";
import './message-form.css'

export function MessageForm(input: FromTag<{
   user: User
}>
) {
   const { user } = input

   const $message = ion('')
   const $error = ion(null as string | null)

   async function reKeydown(e: KeyboardEvent & any) {
      if (e.key !== 'Enter') {
         if ($error()) $error.state = null;
         return;
      }
      e.preventDefault();
      const response = await postChatMessage({
         name: user.name,
         text: $message()
      })
      if (response.error) {
         $error.state = response.error
      }
      else {
         console.log('reset message')
         $message.state = ''
      }
   }

   return component(
      <form class='message-form'>
         <textarea
            placeholder="Type a message and hit enter to send"
            on:keydown={reKeydown}
         >
            {{ mu: $message }}
         </textarea>
         {If($error,
            <div class='error'>{$error}</div>
         )}
      </form>
   )
}