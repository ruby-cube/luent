import { component, Else, For, If, NodeRef, RENDER } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";
import './chat-window.css'
import { getChatMessages } from "../database/database";
import { formatDistanceToNow } from 'date-fns'

export function ChatWindow() {
   const { $error, $messages } = getChatMessages()
   const $formattedMessages = ion(() => $messages().map(message => (
      { ...message }
   )))

   const $messagesDiv = NodeRef('div')

   watch($messages, () => {
      const div = $messagesDiv()
      if (!div) return;
      div.scrollTop = div.scrollHeight
   }, { eager: true, phase: RENDER })

   return component(
      <div class='chat-window'>
         {If($error,
            <div class='error'>{$error}</div>
         )}
         {Else(
            <div class='messages' ref={$messagesDiv}>
               {For($formattedMessages, m => m.id, (message) =>
                  <div class='single'>
                     <span class="created-at">{formatDistanceToNow(message.createdAt.toDate())}</span>
                     <span class="name">{message.name}</span>
                     <span class="message">{message.text}</span>
                  </div>
               )}
            </div>
         )}
      </div>
   )
}