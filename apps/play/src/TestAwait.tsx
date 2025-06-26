import { component, createSuspenseIon, fromTag } from "@rue/lumo";
import { _$$AwaitSeries, Await, Meanwhile, Catch } from "../../../packages/lumo/src/boundaries/Await";
import { Ion } from "@rue/quarky";

function fetchData() {
   return createSuspenseIon(new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve({ name: 'kermit' })
      }, 5000)
   }), { mustAwait: true })
}

function fetchNestedData() {
   return createSuspenseIon(new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve({ name: 'sir robin' })
      }, 8000)
   }), { mustAwait: true })
}

export function TestAwait() {


   return component(
      <>
         <h1>Untitled Goose Game</h1>
         {_$$AwaitSeries([
            Await(() =>
               <ChildB></ChildB>
            ),
            Meanwhile(() =>
               <Loading></Loading>
            ),
            Catch(err =>
               <ErrorView error={err}></ErrorView>
            )])}
            <hr></hr>
         <h1>Untitled Goose Game</h1>
         {_$$AwaitSeries([
            Await(() =>
               <Child></Child>
            ),
            Meanwhile(() =>
               <Loading></Loading>
            ),
            Catch(err =>
               <ErrorView error={err}></ErrorView>
            )])}
      </>
   )
}

function ChildB() {
   const $kermit = fetchData()

   return component(
      <>
      {'B'}
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
      </>
   )
}

function Child() {
   const $kermit = fetchData()

   return component(
      <>
         <div>{($kermit()?.name)}</div>
         <div>Child :)</div>
         <GrandChild></GrandChild>
      </>
   )
}

function GrandChild() {
   const $robin = fetchNestedData()

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

function ErrorView({ $error } = fromTag<{ error: Ion<unknown> }>()) {
   console.log('render error view')
   return component(
      <>
         {/* <div>{$error}</div> */}
      </>
   )
}