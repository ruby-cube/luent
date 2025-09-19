import { queueRenderTask, component, Else, For, FromTag, If, NodeRef, POSTRENDER, PRERENDER, RENDER, fromApp, atUnmount, queuePostrenderTask, atDemount, atRemounted } from "@rue/lumo";
import { ion, ionic } from "@rue/quarky";
import './chat-window.css'
import type { ChatKit, Message } from "../database/database";
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
   console.log('ChatWindow()')
   const $messagesNode = NodeRef('div')

   const $newMessageMarker = ion(null as null | HTMLDivElement)
   const $hasUnseenMessages = ion(false)
   const $notifyNewMessages = ion(false)
   const $smoothScroll = ion(false)

   atRemounted(() => {
      $smoothScroll.state = false;
      $notifyNewMessages.state = false;

      queuePostrenderTask(() => {
         scrollToNew()
         queuePostrenderTask(() => {
            $smoothScroll.state = true;
            console.log('A smooth true')
         })
      })
   })

   // atRemounted(async () => {
   //    $smoothScroll.state = false;
   //    $notifyNewMessages.state = false;

   //    await __postrender__()
   //    scrollToNew()

   //    await __postrender__()
   //    $smoothScroll.state = true;
   // })

   atDemount(() => {
      if (!$hasUnseenMessages()) $newMessageMarker.state = null
   })

   atMessagePosted(() => {
      $hasUnseenMessages.state = false;
      $newMessageMarker.state = null
      scrollToBottom()
   })

   atErrorReceived(() => {
      if (isScrolledToBottom()) {
         scrollToBottom()
      }
   })

   atMessageReceived(() => {
      console.log('??? message received! smooth?', $smoothScroll())
      if (isScrolledToBottom()) {
         scrollToBottom()
      }
      else {
         $hasUnseenMessages.state = true;
      }

      queuePostrenderTask(() => {
         $smoothScroll.state = true;
         console.log('B smooth true')
      })
   })

   function isScrolledToBottom() {
      const node = $messagesNode()
      return node && Math.abs(node.scrollTop - (node.scrollHeight - node.clientHeight)) < 10
   }

   function isScrolledAboveNewMessages() {
      const node = $messagesNode()
      const newMessageMarker = $newMessageMarker()
      if (!node || isScrolledToBottom()) return false;
      if (!newMessageMarker) return true;
      return newMessageMarker.offsetTop - node.scrollTop > 516
   }

   function scrollToNew() {
      const node = $messagesNode()
      if (!node) {
         return;
      }
      const newMessageMarker = $newMessageMarker()
      if (!newMessageMarker) {
         scrollToBottom()
         return;
      }

      node.scrollTop = newMessageMarker.offsetTop - (63 + 44) //TODO: what are these numbers?
   }

   function scrollToBottom() {
      const node = $messagesNode()
      if (!node) {
         return;
      }
      queueRenderTask(() => {
         node.scrollTop = node.scrollHeight
      })
   }

   function reScrollend(e: any) {
      if (isScrolledToBottom()) {
         $hasUnseenMessages.state = false;
      }
      if (isScrolledAboveNewMessages()) {
         $notifyNewMessages.state = true;
      }
      else {
         $notifyNewMessages.state = false;
      }
      user.lastSeenMessageID = findLastSeenMessage()?.id ?? user.lastSeenMessageID
   }

   function findLastSeenMessage() {
      if (isScrolledToBottom())
         return $messages().at(-1)
   }


   function $ShowNewMessageMarker(message: Message) {
      return ion(() => {
         const lastMessage = $messages().at(-1)
         const newMessageMarker = $newMessageMarker()
         return ($hasUnseenMessages() && user.lastSeenMessageID === message.id || newMessageMarker && newMessageMarker.getAttribute('data-messageID') === message.id) && lastMessage && lastMessage.id !== message.id
      })
   }

   return component(
      <div class='chat-window'>
         {If($error,
            <div class='error'>{$error}</div>
         )}
         {Else(
            <div class='messages' ref={$messagesNode} on:scrollend={reScrollend} style={{ scrollBehavior: ($smoothScroll() ? 'smooth' : 'auto') }}>
               {For($messages, m => m.id, (message) => (
                  <>
                     <div>
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
                     </div>
                     {If($ShowNewMessageMarker(message),
                        <div at:mounted={node => (console.log('*** DIV MOUNTED'), message.id === user.lastSeenMessageID && ($newMessageMarker.state = node))} data-messageID={message.id}>
                           --- new messages ---
                        </div>
                     )}
                  </>
               ))}
            </div>
         )}
         {If(($hasUnseenMessages() && $notifyNewMessages()), //FIX: without the outer div, the if series affects message form
            <div>
               New messages below!
               <button on:click={scrollToBottom}>⌄</button>
            </div>
         )}
      </div>
   )
}
