//@ts-nocheck
/**
 * I want to understand the difference between
 * - component events "on:incrementClick" // TODO: should use Web API Event and EventTarget, need to create a mini detached dom
 * - component methods "can:increment"
 * - app/model hooks (can:atIncrementCount -- state is higher up, allow children to )
 * - composed events and bubbling
 */

import { getActiveFlask } from "@rue/flask";
import { template, FromTag } from "@rue/luent";
import { Ion, Ionic } from "@rue/quarky";
import { AnyObject } from "@rue/types";




function StatefulCounter(input: FromTag<{
   'on:increment': (e: CountEvent) => void
   'on:decrement': (e: CountEvent) => void
}>) {
   const { emit } = input

   const $count = ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   function incrementCount() {
      $count.increment();
      emit('increment', { count: $count() })
   }

   function decrementCount() {
      $count.decrement();
      emit('decrement', { count: $count() })
   }

   return template(
      <>
         <div>{$count}</div>
         <button on:click={incrementCount}>+</button>
         <button on:click={decrementCount}>-</button>
         <button on={tempo(e => $bpm.value = e.bpm)}>bpm</button>
      </>
   )
}



function DumbCounter(input: FromTag<{
   count: Ion<number>
   'on:incrementClick': () => void
   'on:derementClick': () => void
}>) {
   const { $count, emit } = input

   return template(
      <>
         <div>{$count}</div>
         <button on:click={e => emit('incrementClick')}>+</button>
         <button on:click={e => emit('derementClick')}>-</button>
      </>
   )
}



function DumbCounterC(input: FromTag<{
   count: Ion<number>
   incrementCount: () => void
   decrementCount: () => void
}>) {
   const { $count, incrementCount, decrementCount } = input

   return template(
      <>
         <div>{$count}</div>
         <button on:click={e => incrementCount()}>+</button>
         <button on:click={e => decrementCount()}>-</button>
      </>
   )
}



function DumbCounterB(input: FromTag<{
   'mu:count': Ion<number> & { increment: () => void, decrement: () => void }
}>) {
   const { $count, mu } = input

   return template(
      <>
         <div>{$count}</div>
         <button on:click={e => mu($count).increment()}>+</button>
         <button on:click={e => mu($count).decrement()}>-</button>
      </>
   )
}



interface ProductData {
   id: string
   qty: number
   name: string
}

class Product implements ProductData {
   id: string;

   constructor(data: ProductData) {
      this.id = data.id
      this.qty = data.qty
      this.name = data.name
   }

   qty: number = 0
   name: string = 'cucumber'

   incrementQty() {

   }

   decrementQty() {

   }
}

type IonicProduct = ReturnType<typeof IonicProduct>
type $$Product = ReturnType<typeof IonicProduct>

function IonicProduct(data: ProductData) {


   return ionic(new Product(data), {
      '@incrementQty'() {

      },
      '@decrementQty'() {

      }
   })
}


hook(product, {
   'incrementQty': (e: IncrementQtyEvent) => {

   }
})

hook(product, {
   'incrementQty': (e: IncrementQtyEvent) => {

   },
   'decrementQty': (e: IncrementQtyEvent) => {

   }
})


function Parent() {

   const product = ionic(new Product({}))

   return template(
      <>
         <Child
            can:atIncrementProductQty={getHook(product, 'incrementQty')}
            can:postMessage={postMessage}
            on:click={ }
         ></Child>

         {/* <ChildB o={{ '@incrementProductQty': getHook(product, '@incrementQty') }}></Child> */}
      </>
   )
}


function Child(input: FromTag<{
   'can:atIncrementProductQty': (task: Task) => (() => void)
}>) {
   const { atIncrementProductQty } = input

   atIncrementProductQty(e => {

   })
}

// function ChildB(input: FromTag<{
//    o: { '@incrementProductQty': (task: Task) => (() => void) }
// }>) {
//    const { o } = input

//    o["@incrementProductQty"](e => {

//    })
// }


function hook(proxy: AnyObject, method: string, task: Task, options?: { until: any }) {
   const flask = getActiveFlask()
   const target = asHookTarget(proxy)
   target.addEventListener(method, task)
   flask.atDiscard(unhook)

   function unhook() {
      target.removeEventListener(method, task)
   }

   if (options?.until) {
      until(unhook) // TODO: abort signal 
   }

   return unhook
}


class CallEvent<I, O> extends Event {
   constructor(type: string, input: I, output: O, options) {
      super(type, options)
   }
   stateSnapshot: I
   input: I
   output: O
}


function wrappedMethod(...input: any[]) {
   // TODO: need to snapshot input that is mutated...
   const output = method(...input)
   const callEvent = new CallEvent(methodKey, input, output)
   target.dispatchEvent(callEvent)
}


// NOTE: product.qty cannot be incremented elsewhere in the app. The brains lives in the stateful counter
// This pattern is only good if the StatefulCounter is used as THE stateful counter of that product
// So it's great for a Tempo component where calculating tempo is a complex operation and you only need it in once place in the app
// Not so great for product quantity which you need to mutate in several places

function DumbProduct(input: FromTag<{
   product: IonicProduct
}>) {
   const { product } = input

   return template(
      <>
         <StatefulCounter
            on:decrement={e => product.qty = e.count}
            on:increment={e => product.qty = e.count}
         ></StatefulCounter>
      </>
   )
}


function SmartProduct(input: FromTag<{
   'mu:product': IonicProduct
}>) {
   const { product } = input

   return template(
      <>
         <DumbCounterB
            mu:count={$(product.$qty, { increment: mu(product).incrementQty, decrement: mu(product).decrementQty })}
         ></DumbCounterB>

         <DumbCounterB mu:count={$(product.$qty, {
            increment: mu(product).incrementQty,
            decrement: mu(product).decrementQty
         })}></DumbCounterB>



         <DumbCounterB
            mu:count={$(product.$qty, {
               increment: mu(product).incrementQty,
               decrement: mu(product).decrementQty
            })}
         ></DumbCounterB>

         <DumbCounterC
            count={product.$qty}
            can:incrementCount={mu(product).incrementQty}
            can:decrementCount={mu(product).decrementQty}
         ></DumbCounterC>
         <DumbCounter
            count={product.$qty}
            on:incrementClick={e => mu(product).incrementQty()}
            on:derementClick={e => mu(product).decrementQty()}
         ></DumbCounter>
         <DumbCounterB
            mu:count={ion(product.$qty, {
               increment() { mu(product).incrementQty() },
               decrement() { mu(product).decrementQty() }
            })}
         ></DumbCounterB>
         <DumbCounterB
            mu:count={ion(product.$qty, {
               increment: mu(product).incrementQty,
               decrement: mu(product).decrementQty
            })}
         ></DumbCounterB>
      </>
   )
}