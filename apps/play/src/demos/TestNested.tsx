import { component } from "@rue/lumo";
import { finiton, ion, watch } from "@rue/quarky";

export function TestNested() {
   const $isActive = ion(true, {
      toggle() {
         $isActive.state = !$isActive()
      }
   })

   const $isHappy = ion(true, {
      toggle() {
         $isHappy.state = !$isHappy()
      }
   })

   watch($isActive, ({ state: isActive }) => {
      console.log('### isActive', isActive)
      watch($isHappy, ({ state: isHappy }) => {
         console.log('### isHappy', isHappy)
      }, { eager: true })
   }, { eager: true })


   return component(
      <>
         <div>is active: {$isActive}</div>
         <div>is happy: {$isHappy}</div>
         <button on:click={e => $isActive.toggle()}>toggle active</button>
         <button on:click={e => $isHappy.toggle()}>toggle happy</button>
      </>
   )
}

export function TestNestedB() {

   const $colorType = finiton({
      'cool': {
         toggle: () => 'warm'
      },
      'warm': {
         toggle: () => 'cool'
      }
   })

   const $color = finiton({
      'blue': {
         toggle: () => 'green'
      },
      'green': {
         toggle: () => 'blue'
      },
      'red': {
         toggle: () => 'orange'
      },
      'orange': {
         toggle: () => 'red'
      }
   })

   $colorType.activate(() => 'cool').nest({
      'cool': [$color.init(() => 'blue')],
      'warm': [$color.init(() => 'red')]
   })


   // const $hasColor = finiton('true', {
   //    'true': {
   //       toggle: () => 'false'
   //    },
   //    'false': {
   //       toggle: () => 'true'
   //    }
   // })

   // $hasColor.activate()

   const $hasColor = ion(true, {
      toggle() {
         $hasColor.state = !$hasColor()
      }
   })

   return component(
      <>
         <div style={($hasColor() ? { backgroundColor: $color } : { backgroundColor: 'black' })}>hi</div>
         <div>hasColor: {$hasColor}</div>
         <div>color type: {$colorType}</div>
         <div>color: {$color}</div>
         <button on:click={e => $hasColor.toggle()}>toggle has color</button>
         <button on:click={e => $color.apply('toggle')}>toggle color</button>
         <button on:click={e => $colorType.apply('toggle')}>toggle warm/cool</button>
      </>
   )
}