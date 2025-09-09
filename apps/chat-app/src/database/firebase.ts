import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, User as FirebaseUser, Auth, UserCredential } from "firebase/auth";
import { addDoc, collection, Firestore, getFirestore, Timestamp, query, orderBy, onSnapshot, doc, setDoc } from "firebase/firestore";
import { User } from "../commons/keys";
import { atUnmount, fromGlobal, provideGlobal } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";

// Import the functions you need from the SDKs you need
// https://firebase.google.com/docs/web/setup#available-libraries

export function initDatabaseConnection() {
   // Initialize Firebase
   const app = initializeApp({
      apiKey: "AIzaSyA0oXLFu-D5rKdmekwx2uEYZSftpAMzAm0",
      authDomain: "chat-demo-80a09.firebaseapp.com",
      projectId: "chat-demo-80a09",
      storageBucket: "chat-demo-80a09.firebasestorage.app",
      messagingSenderId: "993585086542",
      appId: "1:993585086542:web:6efec419bf383a5958031f"
   });

   const db = getFirestore(app)

   const auth = getAuth(app)

   provideGlobal('auth', auth)
   provideGlobal('db', db)

   const $connected = ion(false)

   const unsubscribe = onAuthStateChanged(auth, () => {
      $connected.state = true
      unsubscribe()
   })

   return $connected
}

let pendingLogin: Promise<{ error: string | null }> | null = null

export function signUp(email: string, password: string, username: string) {
   const auth = fromGlobal('auth') as Auth //TODO: easy typing, throw error if not provided

   return pendingLogin = createUserWithEmailAndPassword(auth, email, password)
      .then(async ({ user }) => {
         await updateProfile(user, { displayName: username })
         return {
            // user,
            error: null
         }
      })
      .catch((err: Error) => (
         {
            // user: null,
            error: err.message
         }
      ))
}

export function logIn(email: string, password: string) {
   const auth = fromGlobal('auth') as Auth

   return pendingLogin = signInWithEmailAndPassword(auth, email, password)
      .then(({ user }) => (
         {
            // user,
            error: null
         }
      ))
      .catch((err: Error) => (
         {
            // user: null,
            error: err.message
         }
      ))
}

export function logOut() {
   const auth = fromGlobal('auth') as Auth

   return signOut(auth)
      .then(() => (
         { error: null }
      ))
      .catch((err: Error) => (
         { error: err.message }
      ))
}

export function onLoggedIn(task: (user: User | null) => void) {
   const auth = fromGlobal('auth') as Auth

   const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
         if (pendingLogin) {
            await pendingLogin;
         }
         if (__DEV__ && (!user.displayName || !user.email)) throw new Error('display name or email missing')
         task({ name: user.displayName!, email: user.email! })
      }
   })
   atUnmount(final => {
      if (!final) return
      unsub()
   })
}

export function onLoggedOut(task: () => void) {
   const auth = fromGlobal('auth') as Auth
   const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) task()
   })
   atUnmount(final => {
      if (!final) return
      unsub()
   })
}


export type MessageData = {
   author: string,
   text: string,
   createdAt: Timestamp
}

export type Message = {
   id: string,
   author: string,
   text: string,
   createdAt: Timestamp
   error: null | MessageError | undefined

}

type MessageError = {
   message: string;
   pending: boolean
   retry(): void
}




export function ChatMessagesKit() {
   const db = fromGlobal('db') as Firestore

   const unsavedMessages = ionize([] as Message[])
   const unsavedSet = new Set<string>()

   const $messages = ion.ionize([] as Message[])

   const $error = ion(null as null | string)
   const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt'))

   const unsub = onSnapshot(messagesQuery, (snap) => {

      const messages = snap.docs.map(message => {
         if (unsavedSet.has(message.id)) {
            const msg = unsavedMessages[unsavedMessages.findIndex(msg => msg.id === message.id)]
            msg.error = null;
            unsavedSet.delete(message.id)
         }

         return {
            ...message.data() as MessageData,
            id: message.id,
            error: null
         } as Message
      })

      let i = unsavedMessages.length
      while (i--) {
         const unsaved = unsavedMessages[i]
         if (unsaved.error === null) {
            unsavedMessages.splice(i, 1)
         }
         else {
            let j = messages.length;
            while (j--) {
               const savedMsg = messages[j]
               if (unsaved.createdAt.toMillis() > savedMsg.createdAt.toMillis()) {
                  messages.splice(j+1, 0, unsaved)
                  break;
               }
            }
         }
      }

      $messages.state = ionize(messages)
      $error.state = null
   }, err => {
      $error.state = err.message
   })

   atUnmount((final) => {
      if (!final) return;
      unsub()
   })

   async function postChatMessage(message: Message) {
      const newMessageRef = doc(collection(db, 'messages'))
      const newMessage = ionize({
         ...message, 
         id: newMessageRef.id
      })

      unsavedMessages.push(newMessage)
      unsavedSet.add(newMessageRef.id)
      $messages().push(newMessage)

      return post()

      function post() {
         const rando = Math.random()

         // if (rando < .5) {
         //    setTimeout(() => {
         //       newMessage.error = ionize({
         //          message: 'bad connection',
         //          pending: false,
         //          retry() {
         //             this.pending = true;
         //             post()
         //          }
         //       })
         //    }, 200)
         //    return;
         // }


         return setDoc(newMessageRef, {
            text: message.text,
            author: message.author,
            createdAt: message.createdAt
         })
            // .then(() => {
            //    console.log('setDoc resolved')
            //    unsavedMessages.splice(unsavedMessages.findIndex(msg => msg.id === message.id), 1)
            // })
            .catch((err: Error) => {
               newMessage.error = ionize({
                  message: 'bad connection',
                  pending: false,
                  retry() {
                     this.pending = true;
                     post()
                  }
               })
            })
      }
   }

   return {
      postChatMessage,
      $messages,
      unsavedMessages,
      $error
   }
}