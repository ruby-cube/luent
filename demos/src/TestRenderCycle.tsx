import { afterMount, afterUnmount, atLayout, atMount, atPrelude, atRender, atTick, atUnmount, beforeMount, beforeUnmount, Else, If, ion } from "luent"

export function TestRenderCycle() {
  const $open = ion(true)
  console.warn('@@@ ROOT setup')

  atPrelude(() => {
    console.warn('@@@ ROOT at prelude')
  })
  atLayout(() => {
    console.warn('@@@ ROOT at layout')
  })
  atRender(() => {
    console.warn('@@@ ROOT at render')
  })
  atTick(() => {
    console.warn('@@@ ROOT at tick')
  })

  beforeMount(() => {
    console.warn('@@@ ROOT before mount')
  })
  atMount(() => {
    console.warn('@@@ ROOT at mount')
  })
  afterMount(() => {
    console.warn('@@@ ROOT after mount')
  })
  return <>
    {If($open,
      <MyComp></MyComp>
    )}
    {Else(
      <Other></Other>
    )}
    <button on:click={() => $open.value = !$open()}>{() => $open() ? 'hide' : 'show'}</button>
  </>
}


function MyComp() {
  console.warn('@@@ setup')

  atPrelude(() => {
    console.warn('@@@ at prelude')
  })
  atLayout(() => {
    console.warn('@@@ at layout')
  })
  atRender(() => {
    console.warn('@@@ at render')
  })
  atTick(() => {
    console.warn('@@@ at tick')
  })

  beforeMount(() => {
    console.warn('@@@ before mount')
  })
  atMount(() => {
    console.warn('@@@ at mount')
  })
  afterMount(() => {
    console.warn('@@@ after mount')
  })
  return <>
    <div>HelloWorld</div>
  </>
}

function Other() {
  beforeUnmount(() => {
    console.warn('@@@ BEFORE UNMOUNT')
  })
  atUnmount(() => {
    console.warn('@@@ AT UNMOUNT')
  })
  afterUnmount(() => {
    console.warn('@@@ AFTER UNMOUNT')
  })
  return <>
    <div>Bye world</div>
  </>
}