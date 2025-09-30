import { component, FromTag, If } from "@rue/lumo";
import { ion } from "@rue/quarky";
import { User } from "../commons/keys";
import './message-form.css'
import { Timestamp } from "firebase/firestore";
import { Message } from "../database/database";

type MessageFormInput = FromTag<{
   user: User,
   'can:postMessage': (message: Message) => void
}>

export function MessageForm({
   user,
   postMessage
}: MessageFormInput) {

   const $message = ion('')

   async function reKeydown(e: KeyboardEvent & any) {
      if (e.key !== 'Enter') {
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

      $message.value = ''
   }

   return component(
      <form class='message-form'>
         <textarea
            placeholder="Type a message and hit enter to send"
            on:keydown={reKeydown}
            mu:value={$message}
         ></textarea>
      </form>
   )
}