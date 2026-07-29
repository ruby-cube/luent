import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, User as FirebaseUser, Auth, UserCredential } from "firebase/auth";
import { addDoc, collection, Firestore, getFirestore, Timestamp, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { beforeDetach, fromGround, provideGround } from "luent";
import {  ion, watch } from "@luent/quarky";

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

   provideGround('auth', auth)
   provideGround('db', db)

   const $connected = ion(false)

   const unsubscribe = onAuthStateChanged(auth, () => {
      $connected.value = true
      unsubscribe()
   })

   return $connected
}

type UserData = {
   id: string
   lastSeenMessageID: string | null
}

function createUserData(id: string, db = fromGround('db') as Firestore) {
   return setDoc(doc(db, "users", id), {
      lastSeenMessageID: null
   });
}

function getUserData(id: string, db = fromGround('db') as Firestore) {
   return getDoc(doc(db, 'users', id))
}

function updateUserData(id: string, data: Partial<UserData>, db = fromGround('db') as Firestore) {
   return updateDoc(doc(db, 'users', id), data) as unknown as Promise<UserData> //FIX:
}

export class User {

   constructor(
      readonly id: string,
      public name: string,
      public email: string,
      db: Firestore
   ) {
      getUserData(id, db).then((userData) => {
         this.userData = ionize(userData.data() as { lastSeenMessageID: string | null })

         watch(this.userData.$lastSeenMessageID, ({ current: lastSeenMessageID }) => {
            updateUserData(id, { lastSeenMessageID }, db)
         })
      }).catch(err => {
         console.error('Error while getting user data', err)
      })
   }

   private userData: Ionized<{ lastSeenMessageID: string | null }> | undefined

   get lastSeenMessageID() {
      // TODO: throw error if no userData?
      return this.userData!.lastSeenMessageID
   }

   set lastSeenMessageID(id: string | null) {
      // TODO: throw error if no userData?
      this.userData!.lastSeenMessageID = id
   }
}



let pendingLogin: Promise<{ error: string | null }> | null = null

export function signUp(email: string, password: string, username: string) {
   const auth = fromGround('auth') as Auth // TODO: easy typing, throw error if not provided

   return pendingLogin = createUserWithEmailAndPassword(auth, email, password)
      .then(async ({ user }) => {

         await Promise.all([
            updateProfile(user, { displayName: username }),
            createUserData(user.uid)
         ]) // TODO: Catch errors?

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
   const auth = fromGround('auth') as Auth

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
   const auth = fromGround('auth') as Auth

   return signOut(auth)
      .then(() => (
         { error: null }
      ))
      .catch((err: Error) => (
         { error: err.message }
      ))
}


export function onLoggedIn(task: (user: User | null) => void) {
   const auth = fromGround('auth') as Auth
   const db = fromGround('db') as Firestore

   const unsub = onAuthStateChanged(auth, async (authorizedUser) => {
      if (authorizedUser) {
         if (pendingLogin) {
            await pendingLogin;
         }
         if ( __DEV__ && (!authorizedUser.displayName || !authorizedUser.email)) throw new Error('display name or email missing')

         const user = new User(authorizedUser.uid, authorizedUser.displayName!, authorizedUser.email!, db)
         task(user)
      }
   })

   beforeDetach(final => {
      if (!final) return
      unsub()
   })
}

export function onLoggedOut(task: () => void) {
   const auth = fromGround('auth') as Auth
   const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) task()
   })
   beforeDetach(final => {
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
   cancel(): void
}


export type ChatKit = ReturnType<typeof ChatKit>

export function ChatKit() {
   const db = fromGround('db') as Firestore

   const unsavedMessages = ionize([] as Message[])
   const unsavedSet = new Set<string>()

   const $messages = ion.ionize([] as Message[])
   const $errorCount = ion(0)

   function atMessagePosted(task: () => void) {
      watch(unsavedMessages.$length, (e) => {
         if (e.current === 0) return;
         if (e.current < e.previous) return;
         task()
      }, { phase: PRELUDE })
   }

   function atMessageReceived(task: () => void) {
      let prevLength = $messages().length;

      watch($messages, (e) => {
         if (prevLength === $messages().length) return;
         prevLength = $messages().length
         if (e.current === e.previous) {
            return;
         }
         console.log('event', e)
         task()
      }, { phase: PRELUDE })
   }

   function atErrorReceived(task: () => void) {
      watch($errorCount, task, { phase: PRELUDE })
   }

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
                  messages.splice(j + 1, 0, unsaved)
                  break;
               }
            }
         }
      }

      $messages.value = ionize(messages)
      $error.value = null
   }, err => {
      $error.value = err.message
   })

   beforeDetach((final) => {
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

      return post();

      function post() {
         const rando = Math.random()

         if (rando < .25) {
            setTimeout(() => {
               newMessage.error = ionize({
                  message: 'bad connection',
                  pending: false,
                  retry() {
                     this.pending = true;
                     post()
                  },
                  cancel() {
                     const messages = $messages()
                     unsavedMessages.splice(unsavedMessages.indexOf(newMessage), 1)
                     messages.splice(messages.indexOf(newMessage), 1)
                     unsavedSet.delete(newMessageRef.id)
                  }
               })
               $errorCount.value++
            }, 200)
            return;
         }

         return setDoc(newMessageRef, {
            text: message.text,
            author: message.author,
            createdAt: message.createdAt
         })
            .catch((err: Error) => {
               newMessage.error = ionize({
                  message: err.message,
                  pending: false,
                  retry() {
                     this.pending = true;
                     post()
                  },
                  cancel() {
                     const messages = $messages()
                     unsavedMessages.splice(unsavedMessages.indexOf(newMessage), 1)
                     messages.splice(messages.indexOf(newMessage), 1)
                     unsavedSet.delete(newMessageRef.id)
                  }
               })
            })
      }
   }

   return {
      postChatMessage,
      $messages,
      $error,
      atMessagePosted,
      atErrorReceived,
      atMessageReceived
   }
}