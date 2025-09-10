import { atMounted, queueRenderTask, component, Else, For, FromTag, If, NodeRef, POSTRENDER, PRERENDER, RENDER, fromApp, atUnmount, queuePostrenderTask } from "@rue/lumo";
import { ion, Ion, Ionized, multisubject, ThrottlePointer, watch } from "@rue/quarky";
import './chat-window.css'
import type { ChatKit } from "../database/database";
import { formatDistanceToNow } from 'date-fns'
import { User } from '../commons/keys'

// TODO: 
// [ ] only scroll to newest message if scrolled to bottom
// [ ] show new message count if not scrolled to bottom and new message comes in
// [ ] retry() should create a new message for when the retry occurred, the new message should link to the original
// [ ] manage unseen count
// [ ] infinite scroll
// [ ] watch multisubject is broken

export function ChatWindow(input: FromTag<{
   user: User;
   chat: ChatKit;
}>) {
   const { user, chat: { $messages, atMessagePosted, atMessageReceived, atErrorReceived, $error } } = input

   const $messagesNode = NodeRef('div')

   const $hasUnseenMessages = ion(false)

   const $smoothScroll = ion(false)

   atMounted((initial) => {
      if (initial) return;
      $smoothScroll.state = false;
      queuePostrenderTask(() => {
         scrollToBottom()
         queuePostrenderTask(() => {
            $smoothScroll.state = true;
         })
      })
   })

   atMessagePosted(() => {
      console.log('*** message posted')
      queueRenderTask(scrollToBottom)
   })

   atErrorReceived(() => {
      if (isScrolledToBottom()) {
         queueRenderTask(scrollToBottom)
      }
   })

   atMessageReceived(() => {
      console.log('*** message received')
      if (isScrolledToBottom()) {
         queueRenderTask(scrollToBottom)
      }
      else {
         $hasUnseenMessages.state = true;
      }
      queuePostrenderTask(() => {
         $smoothScroll.state = true;
      })
   })

   function isScrolledToBottom() {
      const node = $messagesNode()
      return node && Math.abs(node.scrollTop - (node.scrollHeight - node.clientHeight)) < 2
   }

   function scrollToBottom() {
      const node = $messagesNode()
      if (!node) {
         return;
      }
      node.scrollTop = node.scrollHeight
      user.lastSeenMessageID = $messages().at(-1)?.id
   }

   const reScroll = ThrottlePointer((e: any) => {
      if (isScrolledToBottom()) {
         $hasUnseenMessages.state = false;
      }
   })

   return component(
      <div class='chat-window'>
         {If($error,
            <div class='error'>{$error}</div>
         )}
         {Else(
            <div class='messages' ref={$messagesNode} on:scroll={reScroll} style={{ scrollBehavior: ($smoothScroll() ? 'smooth' : 'auto') }}>
               {For($messages, m => m.id, (message) => (
                  <>
                     <div class='single' style={{ opacity: (message.error === null ? 1 : .5) }}>
                        <span class="created-at">{formatDistanceToNow(message.createdAt.toDate())}</span>
                        <span class="author" style={{ color: (message.author === user.name ? 'green' : 'black') }}>{message.author}</span>
                        <span class="message">{message.text}</span>
                     </div>
                     {If(message.$error,
                        <>
                           <div class='error'>{message.error?.message}</div>
                           <button
                              on:click={e => (!message.error?.pending && message.error!.retry())}
                              style={{ opacity: (message.error?.pending ? .5 : 1) }}
                           >
                              retry
                           </button>
                           <button
                              on:click={e => (!message.error?.pending && message.error!.cancel())}
                              style={{ opacity: (message.error?.pending ? .5 : 1) }}
                           >
                              cancel
                           </button>
                        </>
                     )}
                     {If((user.lastSeenMessageID === message.id && $messages().at(-1) !== message),
                        <div>--- new messages ---</div>
                     )}
                  </>
               ))}
            </div>
         )}
         {If($hasUnseenMessages,
            <div>
               New messages below!
               <button on:click={scrollToBottom}>⌄</button>
            </div>
         )}
      </div>
   )
}