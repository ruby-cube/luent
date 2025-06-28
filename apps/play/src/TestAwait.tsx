import { component, asSuspenseIon, fromTag } from "@rue/lumo";
import { Await, Meanwhile, Catch } from "../../../packages/lumo/src/boundaries/Await";
import { Ion } from "@rue/quarky";

function fetchData() {
   return asSuspenseIon(
      new Promise((resolve, reject) => {
         setTimeout(() => {
            reject('nooo')
            resolve({ name: 'kermit' })
         }, 5000)
      }) as Promise<{ name: string }>
   )
}

function fetchNestedData() {
   return asSuspenseIon(
      new Promise((resolve, reject) => {
         setTimeout(() => {
            resolve({ name: 'sir robin' })
         }, 8000)
      }) as Promise<{ name: string }>
   )
}

function fetchNestedDataB() {
   return asSuspenseIon(
      new Promise((resolve, reject) => {
         setTimeout(() => {
            resolve({ name: 'sir robin the brave' })
         }, 8000)
      }) as Promise<{ name: string }>
   )
}

export function TestAwait() {
   const $brave = fetchNestedDataB()

   return component(
      <>
         <h1>Untitled Goose Game</h1>
         {Await($brave,
            <ChildB></ChildB>
         )}
         {Meanwhile(() =>
            <Loading></Loading>
         )}
         {Catch(err => (console.log('error!!', err),
            <ErrorView error={err}></ErrorView>
         ))}
         <hr></hr>
         <h1>Untitled Goose Game</h1>
         {Await(
            <Child></Child>
         )}
         {Meanwhile(
            <Loading></Loading>
         )}
         {Catch(err =>
            <ErrorView error={err}></ErrorView>
         )}
      </>
   )
}

function ChildB() {
   const $kermit = fetchData().awaited()

   return component(
      <>
         {'B'}
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
      </>
   )
}

function Child() {
   const $kermit = fetchData().awaited()

   return component(
      <>
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
         <GrandChild></GrandChild>
      </>
   )
}

function GrandChild() {
   const $robin = fetchNestedData().awaited()

   return component(
      <>
         <div>{($robin()?.name)}</div>
         <div>GrandChild :)</div>
      </>
   )
}

function Loading() {
   console.log('render loading view')
   return component(
      <>
         <div>Loading...</div>
      </>
   )
}

function ErrorView({ $error } = fromTag<{ error: Ion<Error> }>()) {
   console.log('render error view')
   return component(
      <>
         <div>{($error()?.message)}</div>
      </>
   )
}