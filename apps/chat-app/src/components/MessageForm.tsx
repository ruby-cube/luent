
//@ts-nocheck
import { template, FromTag, If } from "@rue/luent";
import { Ion, ion } from "@rue/quarky";
import { User } from "../context/keys";
import './message-form.css'
import { Timestamp } from "firebase/firestore";
import { Message } from "../database/database";


export function MessageForm(input: FromTag<{
   user: User,
   postMessage: (message: Message) => void
}>) {

   const { user, postMessage } = input()

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

   return template(
      <form class='message-form'>
         <textarea
            placeholder="Type a message and hit enter to send"
            on:keydown={reKeydown}
            mu:value={$message}
         ></textarea>
      </form>
   )
}