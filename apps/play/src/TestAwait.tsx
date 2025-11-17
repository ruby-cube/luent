import { component, SuspenseIon, Else, If, FromTag } from "@rue/lumo";
import { Await, Meanwhile, Catch } from "../../../packages/lumo/src/boundaries/Await";
import {  Ion } from "@rue/quarky";




function fetchData(options: { awaited: true }) {
   return SuspenseIon(undefined,
      new Promise((resolve, reject) => {
         setTimeout(() => {
            // reject('nooo')s
            resolve({ name: 'kermit' })
         }, 5000)
      }) as Promise<{ name: string }>,
      options)
}

function fetchNestedData($name: Ion<string>, options: { awaited: true }) {
   return SuspenseIon({ name: 'standin' }, () =>
      new Promise((resolve, reject) => {
         const name = $name()
         setTimeout(() => {
            resolve({ name })
         }, 1000)
      }) as Promise<{ name: string }>,
      options)
}

function fetchNestedDataB($name: Ion<string>) {
   return SuspenseIon({ name: 'placeholder' },
      new Promise((resolve, reject) => {
         setTimeout(() => {
            resolve({ name: 'nona' })
         }, 8000)
      }) as Promise<{ name: string }>
   )
}

export function TestAwait() {
   const $name = Ion('sir robin the brave')
   const $brave = fetchNestedDataB($name)

   return component(
      <>
         <button on:click={e => $name.value = $name() + '!'}>click</button>
         <p>{($brave()?.name)}</p>
         <h1>Untitled Goose Game</h1>
         {/* {Await($brave,
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
         <hr></hr> */}
         <h1>Untitled Goose Game</h1>
         {Await(
            <Child name={$name}></Child>
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

function Child({ $name }: FromTag<{ name: string }>) {
   const $kermit = fetchData()

   return component(
      <>
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
         <GrandChild name={$name}></GrandChild>
      </>
   )
}

function GrandChild({ $name }: FromTag<{ name: string }>) {
   const $robin = fetchNestedData($name, {
      awaited: 'load'
   })

   return component(
      <div>
         {/* <div>{(JSON.stringify($robin.promise))}</div> */}
         <div>{($robin()?.name)}</div>
         <hr></hr>
         <div>{($robin()?.name)}</div>
         {If(($robin.loading),
            <>reloading</>
         )}
         {Else(
            <>:)</>
         )}
         <div>GrandChild :)</div>
      </div>
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

function ErrorView({ $error }: FromTag<{ error: Ion<Error> }>) {
   console.log('render error view')
   return component(
      <>
         <div>{($error()?.message)}</div>
      </>
   )
}