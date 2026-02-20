import { ion } from "../../../../packages/quarky/src"
import { pend, Suspense } from "../../../packages/lumo/src/componentSuspense"
import { template } from "@rue/lumo"



const PendingListBlock = Suspense({
   Pending: ListBlock,
   Placeholder() {
      return (<div>I'm not ready...</div>)
   },
   timeout: 9001,
   Error: ({ error }: { error: any }) => <div>Oops! {error}</div>
})

const PendingTextArea = Suspense({
   Pending: TextArea,
   Placeholder() {
      return (<div>loading...</div>)
   },
   // Error: ({ error }: { error: any }) => <div>Ohh noes!! {error}</div>
})


export function NestedPend() {
   const $count = Ion(0)

   return template(
      () =>
         <>
            <h1>Hello World</h1>
            <PendingListBlock></PendingListBlock>
            <p>{$count}</p>
            <button on:click={() => $count.value = $count() + 1}>click</button>
         </>
   )
}

function Something() {
   return (
      <p>hey</p>
   )
}

function ListBlock() {
   return (
      <div>
         <h2>list</h2>
         <PendingTextArea></PendingTextArea>
         <ItemBlockB></ItemBlockB>
      </div>
   )
}

function TextArea() {
   const $word = Ion("not ready")

   pend(
      simFetchC("pomp")
   ).then(word => $word.value = word)

   return (
      <div>
         <h2>text area {$word}</h2>
         <ItemBlockC />
         <ItemBlockD />
      </div>
   )
}


function ItemBlockA() {
   const $word = Ion("not ready")

   pend(simFetch("calico"))
      .then(word => $word.value = word)

   return (
      <div>{$word}</div>
   )
}

function ItemBlockB() {
   const $word = Ion("not ready")

   pend(simLongFetch("basset"))
      .then(word => $word.value = word)

   return (
      <div>{$word}</div>
   )
}

function ItemBlockC() {
   const $word = Ion("not ready")

   pend(simFetchB("cerulean"))
      .then(word => $word.value = word)

   return (
      <div>{$word}</div>
   )
}

function ItemBlockD() {
   const $word = Ion("not ready")

   pend(simLongFetchB("tilted"))
      .then(word => $word.value = word)

   return (
      <div>{$word}</div>
   )
}


function simFetch(word: string) {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(word);
      }, 10)
   })
}

function simFetchC(word: string) {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(word);
      }, 1000)
   })
}

function simLongFetch(word: string) {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(word);
      }, 5000)
   })
}
function simFetchB(word: string) {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(word);
      }, 1)
   })
}

function simLongFetchB(word: string) {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(word);
      }, 4000)
   })
}


