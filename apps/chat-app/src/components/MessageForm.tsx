import { component, FromTag, If } from "@rue/lumo";
import { ion } from "@rue/quarky";
import { User } from "../commons/keys";
import './message-form.css'
import { Timestamp } from "firebase/firestore";
import { Message } from "../database/database";


export function MessageForm(input: FromTag<{
   user: User,
   'can:postMessage': (message: Message) => void
}>) {
   const { user, postMessage } = input

   const $message = ion('')
   // const $error = ion(null as string | null)

   async function reKeydown(e: KeyboardEvent & any) {
      console.log('*** reKeydown')
      if (e.key !== 'Enter') {
         // if ($error()) $error.state = null;
         return;
      }
      e.preventDefault();

      postMessage({
         id: '',
         author: user.name,
         text: $message(),
         createdAt: Timestamp.fromDate(new Date()),
         error: undefined
      })

      $message.state = ''

      // const response = await postChatMessage({
      //    name: user.name,
      //    text: $message()
      // })

      // if (response.error) {
      //    $error.state = response.error
      // }
      // else {
      //    $message.state = ''
      // }
   }

   return component(
      <form class='message-form'>
         <textarea
            placeholder="Type a message and hit enter to send"
            on:keydown={reKeydown}
            mu:value={$message}
         ></textarea>
         {/* {If($error,
            <div class='error'>{$error}</div>
         )} */}
      </form>
   )
}