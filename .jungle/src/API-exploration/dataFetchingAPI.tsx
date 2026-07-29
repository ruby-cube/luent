//@ts-nocheck
import { component, template, Else, If, v } from "luent";
import {Ion } from "@luent/quarky";


const POSTS = Symbol()

const USER_POSTS = defineFetch({
   fetch({ $userId }) {
      return fetch(`https://someplace.com/${$userId()}`)
   },
   catch(err) {

   }
})

export function List() {
   const $userId = ion('')

   const $userPosts = fromCloud(USER_POSTS, { $userId })

   const $userPosts = dispatch({ get: POSTS, with: $userId, overlap: 'pile | overwrite | block', suspense: true }); // returns an ion and collects promises for suspense, will rerun if $userId changes

   const value = resolve(fetch(''), { suspense: true }) // returns an ion and collects promises for suspense


   async function submit() {
      const [posts, error] = await dispatch({ get: POSTS, })
      const [data, error] = await resolve(pendingData)
   }

   return (

      <>
         {Await($userPosts, { hold: Loading, catch: ErrorBlock },
            <div>{$userPosts()}</div>
         )}
         {Suspense({ hold: Loading },
            <Item />
         )}
      </>
   )
}



function Loading() {

}

function ErrorBlock() { }

function Await(...args: any[]) {

}

function Suspense(...args: any[]) {

}
function Item(...args: any[]) {
   return (

      <></>
   )
}

function dispatch(request: { get: symbol, with: Ion }) {
   return ion('hi', {
      loading() {
         return true;
      }
   })
}

function defineDispatch(...arg: any[]) {

}

defineDispatch(POSTS, {
   type: v<string>('?')('dog'),
   dispatch: ($userId: Ion<string>) =>
      fetch('')
})
