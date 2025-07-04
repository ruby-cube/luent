import { component, SuspenseIon, fromTag } from "@rue/lumo";
import { Await, Meanwhile, Catch } from "../../../packages/lumo/src/boundaries/Await";
import { Ion } from "@rue/quarky";

function fetchData(options: { awaited: true }) {
   return SuspenseIon(undefined,
      new Promise((resolve, reject) => {
         setTimeout(() => {
            reject('nooo')
            resolve({ name: 'kermit' })
         }, 5000)
      }) as Promise<{ name: string }>,
      options)
}

function fetchNestedData(options: { awaited: true }) {
   return SuspenseIon(undefined,
      new Promise((resolve, reject) => {
         setTimeout(() => {
            resolve({ name: 'sir robin' })
         }, 1000)
      }) as Promise<{ name: string }>,
      options)
}

function fetchNestedDataB() {
   return SuspenseIon({name: 'placeholder'},
      new Promise((resolve, reject) => {
         setTimeout(() => {
            resolve({ name: 'sir robin the brave' })
         }, 1000)
      }) as Promise<{ name: string }>
   )
}

export function TestAwait() {
   const $brave = fetchNestedDataB()

   return component(
      <>
        <p>{($brave()?.name)}</p>
         <h1>Untitled Goose Game</h1>
         {Await($brave,
            <>
               <ChildB></ChildB>
               <p>{($brave()?.name)}</p>
            </>
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
   const $kermit = fetchData({ awaited: true })

   return component(
      <>
         {'B'}
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
      </>
   )
}

function Child() {
   const $kermit = fetchData({ awaited: true })

   return component(
      <>
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
         <GrandChild></GrandChild>
      </>
   )
}

function GrandChild() {
   const $robin = fetchNestedData({ awaited: true })

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