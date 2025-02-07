import { component, fromCommons, fromTag, prep, TypedKey, v } from "@rue/lumo"
import { DerivedIon, ion, ionize } from "@rue/quarky";
import { asPropIon } from "../../../packages/quarky/src/ionized/PrimaryPion";

const COUNTER = Symbol("Counter") as TypedKey<Counter>
const DOUBLE_COUNT = Symbol("DerivedIon<number>") as TypedKey<DerivedIon<number>>
const NAME = Symbol(`{
    $: string;
    makeKermit: () => void;
}`) as TypedKey<{
   $: string;
   makeKermit: () => void;
}>

// Cases
// - Read-only ion
// - Read-only writable derived ion
// - ion or derived ion that can only be set with provided methods
// - ionic model that only exposes some methods
// - readonly props ion when object is encapsulated

class Counter {
   $: { count: number }

   constructor() {
      this.$ = ionize({ count: 0 })
   }

   increment() {
      this.$.count++
   }

   decrement() {
      this.$.count--
   }
}

function Card() {

   function renderSlot() { }

   return component(
      <div>
         {renderSlot()}
      </div>
   )
}

type Context = {
   onCreated: (cb: Function) => void
}
function getCommons() {
   return {} as Context
}
function getThisComponent() {
   return {} as Context
}

export function ParentBlock(
   input = fromTag({
      content: v<string>,
   })
) {
   const { content } = prep(input)

   const _this = getThisComponent();

   _this.onCreated(() => {

   })


   // const counter = provide(COUNTER, new Counter());
   // const $doubleCount = provide(DOUBLE_COUNT, ion(() => counter.$.count * 2));

   const $name = ion("Sir Robin", {
      set(name: string) {
         $name.state = name
      },
      makeBrave() {
         $name.state = $name() + 'The Brave'
      },
      makeKermit() {
         console.log("make kermit")
         $name.state = 'Kermit'
      }
   })


   const $frog = ionize({
      qualities: 'brave'
   }, {
      setQualities() {
         $frog.qualities = 'valiant'
      }
   })

   const $qualities = ion.of($frog, 'qualities', {
      set: "setQualities"
   })

   provide(NAME, ionize({
      $: $name,
      makeKermit: $name.makeKermit
   }))

   return component(
      <>
         <h1>Parent</h1>
         <div on:click={$qualities.set}>{() => $frog.qualities}</div>
         <div on:click={() => $frog.setQualities()}>{$qualities}</div>
         <div>{$doubleCount}</div>
         <ChildBlock hi={0} />
         <SiblingBlock />
         <button on:click={() => counter.increment()}>increment</button>
         <button on:click={() => counter.decrement()}>decrement</button>
      </>
   )
}


function ChildBlock(
   setup: {
      hi: string
   }
) {
   const counter = fromCommons(COUNTER)

   return component(
      <div style='outline: solid 1px gray; background-color: #C0CAAD; padding: 15px'>
         <h1>Child</h1>
         <p>
            {() => counter.$.count}
         </p>
         <GrandChildBlock></GrandChildBlock>
         <button on:click={() => counter.increment()}>increment</button>
         <button on:click={() => counter.decrement()}>decrement</button>
      </div>
   )
}


function SiblingBlock() {
   const counter = fromCommons(COUNTER)

   return component(
      <div style='outline: solid 1px gray; background-color: #B26E63'>
         <h1>Sibling</h1>
         <p>
            {() => counter.$.count}
         </p>
      </div>
   )
}

function GrandChildBlock() {
   const counter = fromCommons(COUNTER)
   const $doubleCount = fromCommons(DOUBLE_COUNT)
   const name = fromCommons(NAME)
   const $name = asPropIon(name, '$')
   const $count = asPropIon(counter.$, 'count')



   console.log("$double count", $doubleCount)

   return component(
      <div style='outline: solid 1px gray; background-color: #B26E63'>
         <h1 on:click={() => name.makeKermit()}>Grandchild: {$name}</h1>
         <h1 on:click={() => name.makeKermit()}>Grandchild: {() => name.$}</h1>
         <p>
            {$count}
         </p>
         <p>double: {$doubleCount}</p>
      </div>
   )
}


