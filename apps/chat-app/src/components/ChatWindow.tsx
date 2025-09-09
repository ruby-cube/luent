import { component, Else, For, FromTag, If, NodeRef, POSTRENDER, RENDER } from "@rue/lumo";
import { Ion, Ionized, multisubject, watch } from "@rue/quarky";
import './chat-window.css'
import { Message } from "../database/database";
import { formatDistanceToNow } from 'date-fns'
import { User } from '../commons/keys'


export function ChatWindow(input: FromTag<{
   user: User;
   messages: Ion<Ionized<Message[]>>;
   error: Ion<string | null>;
}>) {
   const { $error, $messages, user } = input

   watch($messages, ()=>{
      console.log('proxy?', $messages()[0])
   })

   const $messagesNode = NodeRef('div')

   watch(() => ($messages().length), () => { //TODO: multisubject is broken
      const node = $messagesNode()
      if (!node) {
         return;
      }
      node.scrollTop = node.scrollHeight
   }, { eager: true, phase: RENDER })

   return component(
      <div class='chat-window'>
         {If($error,
            <div class='error'>{$error}</div>
         )}
         {Else(
            <div class='messages' ref={$messagesNode}>
               {For($messages, m => m.id, (message) =>(
                  <>
                     <div class='single' style={{ opacity: (message.error === null ? 1 : .5) }}>
                        <span class="created-at">{formatDistanceToNow(message.createdAt.toDate())}</span>
                        <span class="author" style={{ color: (message.author === user.name ? 'green' : 'black') }}>{message.author}</span>
                        <span class="message">{message.text}</span>
                     </div>
                     {If(message.$error, 'show',
                        <>
                           <div class='error'>{message.error?.message}</div>
                           <button
                              on:click={e => (!message.error?.pending && message.error!.retry())}
                              style={{ opacity: (message.error?.pending ? .5 : 1) }}
                           >
                              retry
                           </button>
                        </>
                     )}
                  </>
               ))}
            </div>
         )}
      </div>
   )
}