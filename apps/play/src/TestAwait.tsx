import { template, AsyncIon, Else, If, FromTag } from "@rue/luent";
import { Await, Meanwhile, Catch } from "../../../packages/luent/src/boundaries/Await";
import {  Ion, ion } from "@rue/quarky";




function fetchData(options: { awaited: true }) {
   return AsyncIon(undefined,
      new Promise((resolve, reject) => {
         setTimeout(() => {
            // reject('nooo')s
            resolve({ name: 'kermit' })
         }, 5000)
      }) as Promise<{ name: string }>,
      options)
}

function fetchNestedData($name: Ion<string>, options: { awaited: true }) {
   return AsyncIon({ name: 'standin' }, () =>
      new Promise((resolve, reject) => {
         const name = $name()
         setTimeout(() => {
            resolve({ name })
         }, 1000)
      }) as Promise<{ name: string }>,
      options)
}

function fetchNestedDataB($name: Ion<string>) {
   return AsyncIon({ name: 'placeholder' },
      new Promise((resolve, reject) => {
         setTimeout(() => {
            resolve({ name: 'nona' })
         }, 8000)
      }) as Promise<{ name: string }>
   )
}

export function TestAwait() {
   const $name = ion('sir robin the brave')
   const $brave = fetchNestedDataB($name)

   return template(
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

   return template(
      <>
         {'B'}
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
      </>
   )
}

function Child({ $name }: FromTag<{ name: string }>) {
   const $kermit = fetchData()

   return template(
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

   return template(
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
   return template(
      <>
         <div>Loading...</div>
      </>
   )
}

function ErrorView({ $error }: FromTag<{ error: Ion<Error> }>) {
   console.log('render error view')
   return template(
      <>
         <div>{($error()?.message)}</div>
      </>
   )
}