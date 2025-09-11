import { atMounted, queueRenderTask, component, Else, For, FromTag, If, NodeRef, POSTRENDER, PRERENDER, RENDER, fromApp, atUnmount, queuePostrenderTask } from "@rue/lumo";
import { ion, Ionized } from "@rue/quarky";
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

   const $messagesNode = NodeRef('div')

   const $newMessageMarker = ion(null as null | HTMLDivElement)
   const $hasUnseenMessages = ion(false)
   const $notifyNewMessages = ion(false)

   const $smoothScroll = ion(false)

   atMounted((initial) => {
      console.log('*** remount')
      if (initial) return;
      $smoothScroll.state = false;
      $notifyNewMessages.state = false;

      queuePostrenderTask(() => {
         console.log('*** scroll to new')
         scrollToNew()
         queuePostrenderTask(() => {
            $smoothScroll.state = true;
         })
      })
   })

   atUnmount(() => {
      if (!$hasUnseenMessages()) $newMessageMarker.state = null
   })

   atMessagePosted(() => {
      console.log('*** message posted')
      $hasUnseenMessages.state = false;
      $newMessageMarker.state = null
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
         console.log('scrolled to bottom')
         queueRenderTask(scrollToBottom)
      }
      else {
         console.log('has unseen messages', $hasUnseenMessages())
         $hasUnseenMessages.state = true;
      }

      queuePostrenderTask(() => {
         $smoothScroll.state = true;
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
      console.log('node.scrollTop', node.scrollTop)
      console.log('newMessageMarker.offsetTop', newMessageMarker.offsetTop)
      return newMessageMarker.offsetTop - node.scrollTop > 516
   }

   function scrollToNew() {
      console.log('*** scrollToNew')
      const node = $messagesNode()
      if (!node) {
         return;
      }
      const newMessageMarker = $newMessageMarker()
      // console.log('*** newMessageMarker', newMessageMarker)
      // console.log('*** lastseen', user.lastSeenMessageID)
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
      node.scrollTop = node.scrollHeight
   }

   const reScrollend = (e: any) => {
      console.log('*** scroll end')
      if (isScrolledToBottom()) {
         $hasUnseenMessages.state = false;
      }
      if (isScrolledAboveNewMessages()) {
         console.log('*** is above new messages')
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
                     {If($ShowNewMessageMarker(message), () => (console.log('rendering marker'),
                        <div at:mounted={node => (console.log('*** DIV MOUNTED'), message.id === user.lastSeenMessageID && ($newMessageMarker.state = node))} data-messageID={message.id}>
                           --- new messages ---
                        </div>
                     ))}
                  </>
               ))}
            </div>
         )}
         <div>
            {If(($hasUnseenMessages() && $notifyNewMessages()), 'show', //FIX: without the outer div, the if series affects message form
               <div>
                  New messages below!
                  <button on:click={scrollToBottom}>⌄</button>
               </div>
            )}
         </div>
      </div>
   )
}

// *** remount
// firebase.ts:233 event StateChangeEvent {previous: Proxy(Array), current: Proxy(Array), eager: false}
// ChatWindow.tsx:54 *** message received
// ChatWindow.tsx:60 has unseen messages
// ListRenderKit.ts:158 updating list?
// ListRenderKit.ts:167 LIST CHANGED
// ListRenderKit.ts:279 new item!!! Proxy(Object) {createdAt: _Timestamp, text: 'C', author: 'peach', id: '1mkmUlU7wXqF967JEk6I', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {createdAt: _Timestamp, author: 'peach', text: 'D', id: 'uQ0Y5jCW0GqbQLY2ndBZ', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {text: 'E', author: 'peach', createdAt: _Timestamp, id: 'NOJEKzjHyhx6XXQpN6kn', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {createdAt: _Timestamp, text: 'F', author: 'peach', id: '0sjsEdFo9tPow7AZAHnd', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {text: 'J', createdAt: _Timestamp, author: 'peach', id: 'hKs76BtDeYX1TGVsvJdk', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {author: 'peach', text: 'I', createdAt: _Timestamp, id: 'A5vqkLMbruF9etNkGLqt', error: null}

// ChatWindow.tsx:75 *** scrollToNew
// ChatWindow.tsx:81 *** newMessageMarker undefined
// ChatWindow.tsx:82 *** lastseen FNXcL5eZpSPgb9PxdjdH
// ChatWindow.tsx:100 *** scroll end

// *** remount
// firebase.ts:233 event StateChangeEvent {previous: Proxy(Array), current: Proxy(Array), eager: false}
// ChatWindow.tsx:54 *** message received
// ChatWindow.tsx:60 has unseen messages
// ListRenderKit.ts:158 updating list?
// ListRenderKit.ts:167 LIST CHANGED
// ListRenderKit.ts:279 new item!!! Proxy(Object) {createdAt: _Timestamp, text: 'P', author: 'peach', id: 'MgQABnKS3sRL9cxv7SGA', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {text: 'Q', createdAt: _Timestamp, author: 'peach', id: 'Oah0yDoS9qntQ4ZDJOpG', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {text: 'R', createdAt: _Timestamp, author: 'peach', id: '3Gxzd88pdCjoOFnHhMHO', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {text: 'T', author: 'peach', createdAt: _Timestamp, id: 'onZQWsrxXyzO55H1c3Xc', error: null}
// ListRenderKit.ts:279 new item!!! Proxy(Object) {author: 'peach', createdAt: _Timestamp, text: 'U', id: 'IYisEHJpxiZRSfIPF5Hk', error: null}
// ChatWindow.tsx:34 *** scroll to new
// ChatWindow.tsx:75 *** scrollToNew
// ChatWindow.tsx:81 *** newMessageMarker undefined
// ChatWindow.tsx:82 *** lastseen iYUhEHPUmRdsTm4Ock7W
// ChatWindow.tsx:100 *** scroll end