import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, User as FirebaseUser, Auth, UserCredential } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { User } from "../commons/keys";
import { fromGlobal, provideGlobal } from "@rue/lumo";
import { ion } from "@rue/quarky";

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
   return onAuthStateChanged(auth, async (user) => {
      if (user) {
         if (pendingLogin) {
            await pendingLogin;
         }
         if (__DEV__ && (!user.displayName || !user.email)) throw new Error('display name or email missing')
         task({ name: user.displayName!, email: user.email! })
      }
   })
}

export function onLoggedOut(task: () => void) {
   const auth = fromGlobal('auth') as Auth
   return onAuthStateChanged(auth, (user) => {
      if (!user) task()
   })
}
