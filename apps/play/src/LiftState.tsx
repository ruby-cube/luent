import { fromTag, $Ion, Ion, NodeRef, v, prep } from "@rue/lumo"
import { AtomicIon, ion } from "../../../packages/quarky/src"



function ParentBlock() {

   const $count = ion(4, {
      increment() {
         $count.value = $count() + 1
      },
      decrement() {
         $count.value = $count() - 1
      }
   });


   const $doubleCount = ion(() => $count() * 2)
   { $: $count() * 2 }
   () => $count() * 2

   function $(arg: any) {
      return null as unknown as any
   }

   const $style = defineStyle(() => ({
      color: 'red',
      backgroundColor: $color() + 'px'
   }))

   const $style = defineStyle(() => ({
      color: 'red',
      backgroundColor: ($color() + 'px')
   }))

   const $style = defineStyle(() => ({
      color: 'red',
      backgroundColor: {$: $color() + 'px'}
   }))

   return {
      render:
         <>
            <div>{{ $: $count() * $count() }}</div>

            <div>{($count() * $count())}</div>

            <ChildBlock $count={$count}></ChildBlock>
            <SiblingBlock count={{ $: $count() + 1 }}></SiblingBlock>
            <button on:click={$count.increment}>increment</button>
            <SiblingBlock count={($count() + 1)}></SiblingBlock>
            <button on:click={$count.decrement}>decrement</button>
         </>
   }
}

function assertEvenNumber(value: any): asserts value is number {
   if (value % 2 !== 0) throw 'invalid'
}



function ChildBlock(
   input = fromTag({
      count: $Ion<number, { increment: () => void; decrement: () => void; }>,
   })
) {
   const { $count } = prep(input)

   return (
      <p>
         {$count}
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
      </p>
   )
}



function SiblingBlock(
   input = fromTag({
      count: Ion<number>
   })
) {
   const { $count } = prep(input)

   return (
      <p>
         {$count}
      </p>
   )
}


