//@ts-nocheck

// FB chat app
// [] increment unseen thread count
// [] append message in chat tab
// [] if open, append message in main messages view
// [] if chat tab is focused or main messages view is open, decrement unseen count

//TODO:
// [] fromCommons type is broken 
// [] AtomicIon type is broken, the state def feels like a hassle... maybe just use this.state? or maybe just use $unseenCount.state++? or .value++? or something else?
// [] defineIonCapsule should use this.count++, for ion(), use $count.value++ ... it should be .value
// [] writing up input type definitions feel like a hassle
// [] instead of readonly as the default, encapsulate as the default. That makes more sense--if you pass an object, you shouldn't expect methods to disappear.

//NOTE: Things I've learned:
// For some things like $chatAppOpen (boolean) it doesn't make sense to put a method on the ion. It feels more like a property of the larger app 
// and therefore it seems to make more sense to write a separate function toggleChatApp(), instead of adding a toggle() method.
// maybe it's just cutting encapsulation corners... But it feels much cleaner that way anyway. Cleaner means more readability.

// I suspect deciding whether a commons object should be mutable or not is going to be a pain.
// I kinda want to just scrap the mu: stuff
// Also I just realized, it's the parent who decides whether to mu or not. While the child can say mu?: or require mu:
// should i make it opt-in? But mu: is useful for two-way binding for elements... for the parent to decide if they want two-way binding.
// - the other option is to disallow mu: for just components, requiring passing down of methods or emitting events.
// but honestly with the ability to track, it seems overkill to encapsulate so stringently. Sometimes it's just more elegant to do $count.value = 10
// 
// Passing an ion with methods is essentially two-way binding..., just a bit more controlled


import { Commons, CommonsKey, component, For, fromCommons, If, Ion, Ionized, v } from "@rue/lumo";
import { ion, ionize, watch } from "@rue/quarky";

class Message {
   constructor(
      public text: string,
      public isNew: boolean = true
   ) { }

   open() {
      this.isNew = false;
   }
}

export function FBApp() {
   const messages = ionize([new Message('bonjour', false), new Message('comment ca va', false), new Message('jai faim quoi', false)])

   const $unseenCount = ion({
      count: 0
   }, {
      increment() {
         this.count++
      },
      decrement() {
         this.count--
      },
   })

   const $chatPopupOpen = ion(false)

   function toggleChatPopup() {
      $chatPopupOpen.state = !$chatPopupOpen.state
   }

   const $chatViewOpen = ion(false)

   function toggleChatView() {
      $chatViewOpen.state = !$chatViewOpen.state
   }

   const $newMessage = ion('')

   function receiveNewMessage() {
      messages.push(new Message($newMessage()))
      $newMessage.state = ''
      $unseenCount.increment()
   }

   return component(
      <div style='border: solid 1px gray; width: 50rem; height: 50rem'>
         <button on:click={toggleChatPopup}>(Z)</button>
         <div style='border-radius: 50%; width: 25px; height: 25px; background-color: red; color: white; text-align: center'>{$unseenCount}</div>
         <div style='display: flex; flex-direction: horizontal'>
            <Commons provide={[
               UNSEEN_COUNT.mu($unseenCount.with_only('decrement')),
               MESSAGES.ro(messages),
               TOGGLE_CHAT_VIEW(toggleChatView)
            ]}>
               <div style='border: solid 1px gray; width: 25rem; height: 25rem'>
                  {If($chatViewOpen,
                     <ChatView></ChatView>
                  )}
               </div>
               <div style='border: solid 1px gray; width: 15rem; height: 15rem'>
                  {If($chatPopupOpen,
                     <ChatPopup></ChatPopup>
                  )}
               </div>
            </Commons>
         </div>
         <input
            mu:value={$newMessage}
            on:input={e => $newMessage.state = e.target.value}
            on:keydown={e => e.code === 'Enter' && receiveNewMessage()}
         ></input>
         <button on:click={e => receiveNewMessage()}>receive new message</button>
      </div>
   )
}


const UNSEEN_COUNT = CommonsKey(Ion<number, {
   increment(): void;
   decrement(): void;
}>)
const MESSAGES = CommonsKey(Ionized<{ text: string, new: boolean }[]>)
const TOGGLE_CHAT_VIEW = CommonsKey(v<() => void>)


export function ChatPopup() {
   const $unseenCount = fromCommons(UNSEEN_COUNT)
   const messages = fromCommons(MESSAGES) as Message[]
   const toggleChatView = fromCommons(TOGGLE_CHAT_VIEW)

   function openMessage(message: Message) {
      message.open()
      $unseenCount.decrement()
   }

   return component(
      <div style='border: solid 1px gray; width: 15rem; height: 15rem'>
         <button on:click={toggleChatView}>[[]]</button>
         <div style='border-radius: 50%; width: 25px; height: 25px; background-color: red; color: white; text-align: center'>{$unseenCount}</div>
         {For(messages, (message) => (
            <p style={{ backgroundColor: (message.isNew ? 'pink' : 'white') }}
               on:click={e => openMessage(message)}
            >{message.$text}</p>
         ))}
      </div>
   )
}

export function ChatView() {
   const $unseenCount = fromCommons(UNSEEN_COUNT)
   const messages = fromCommons(MESSAGES) as Message[]
   const toggleChatView = fromCommons(TOGGLE_CHAT_VIEW)

   function openMessage(message: Message) {
      if (message.isNew) {
         message.open()
         $unseenCount.decrement()
      }
   }

   return component(
      <div style='border: solid 1px gray; width: 25rem; height: 25rem'>
         <button on:click={toggleChatView}>[X]</button>
         <div style='border-radius: 50%; width: 25px; height: 25px; background-color: red; color: white; text-align: center'>{$unseenCount}</div>
         {For(messages, (message) => (
            <p style={{ backgroundColor: (message.isNew ? 'pink' : 'white') }}
               on:click={e => openMessage(message)}
            >{message.$text}</p>
         ))}
      </div>
   )
}



export function FBAppB() {
   const messages = ionize([new Message('bonjour', false), new Message('comment ca va', false), new Message('jai faim quoi', false)])

   const $unseenCount = ion({
      count: 0
   }, {
      increment() {
         this.count++
      },
      decrement() {
         this.count--
      },
   })

   const $chatPopupOpen = ion(false)

   function toggleChatPopup() {
      $chatPopupOpen.state = !$chatPopupOpen.state
   }

   const $chatViewOpen = ion(false)

   function toggleChatView() {
      $chatViewOpen.state = !$chatViewOpen.state
   }

   const $newMessage = ion('')

   function receiveNewMessage() {
      messages.push(new Message($newMessage()))
      $newMessage.state = ''
      $unseenCount.increment()
   }

   return component(
      <div class='container'>
         <button on:click={e => toggleChatPopup()}>(Z)</button>
         <div class='count'>{$unseenCount}</div>
         <div class='outer-edge storage'>
            <Commons provide={[
               UNSEEN_COUNT.mu($unseenCount.wm('decrement')),
               MESSAGES.ro(messages),
               TOGGLE_CHAT_VIEW(toggleChatView)
            ]}>
               <div style='border: solid 1px gray'>
                  {If($chatViewOpen,
                     <ChatView></ChatView>
                  )}
               </div>
               <div style='border: solid 1px gray; width: 15rem; height: 15rem'>
                  {If($chatPopupOpen,
                     <ChatPopup></ChatPopup>
                  )}
               </div>
            </Commons>
         </div>
         <input
            mu:value={$newMessage}
            on:input={e => $newMessage.state = e.target.value}
            on:keydown={e => e.code === 'Enter' && receiveNewMessage()}
         ></input>
         <button on:click={e => receiveNewMessage()}>receive new message</button>
      </div>
   )
}