//@ts-nocheck
import { $listen, $thisFlask } from "@rue/flask"


const attendant = asyncTask(e => {
   console.log(e)
}, {
   enroll: task => document.addEventListener('click', task),
   remove: task => document.removeEventListener('click', task),
})

//--------------------------------

asyncTask({
   onMount: () =>
      setTimeout(() => {
         console.log('time up!')
      }, 100),

   onUnmount: timeout =>
      clearTimeout(timeout),
})

asyncTask({
   onMount: () =>
      setTimeout(() => {
         console.log('time up!')
      }, 100),

   onUnmount: timeout =>
      clearTimeout(timeout),
})


//--------------------------------

const $timeoutA = onMount(() =>
   setTimeout(() => {
      console.log('time up!')
   }, 100)
)

const $timeoutB = onMount(() =>
   setTimeout(() => {
      console.log('time up!')
   }, 100)
)

onUnmount(() => {
   clearTimeout($timeoutA())
   clearTimeout($timeoutB())
})

//--------------------------------

const $timeoutA = onMount(intial => initial &&
   setTimeout(() => {
      console.log('time up!')
   }, 100)
)

const $timeoutB = onMount(() =>
   setTimeout(() => {
      console.log('time up!')
   }, 100)
)

onUnmount(final => {
   if (!final) return;
   clearTimeout($timeoutA())
   clearTimeout($timeoutB())
})

//--------------------------------

onMount(() => {
   const timeoutA = setTimeout(() => {
      console.log('time up!')
   }, 100)

   const timeoutB = setTimeout(() => {
      console.log('time up!')
   }, 100)

   onUnmount(() => {
      clearTimeout(timeoutA)
      clearTimeout(timeoutB)
   })
})


listen(activateBtn, 'click', () => {
   const $chat = onMount(() =>  // will always be a remount for things you want to toggle on and off based on whether somethings visible
      startChat()
   )

   onUnmount(() => { // maybe final or unmount
      $chat().close()
   })
}, { preserve: true }) // preserve means will not be stopped when unmounted

listen(activateBtn, 'click', () => {
   const chat = startChat()

   onUnmount(final => {
      if (!final) return;
      chat.close()
   })
})

//--------------------------------

const $timeouts = onMount(() => ({
   timeoutA: setTimeout(() => {
      console.log('time up!')
   }, 100),

   timeoutB: setTimeout(() => {
      console.log('time up!')
   }, 100)
}))


onUnmount(() => {
   const { timeoutA, timeoutB } = $timeouts()
   clearTimeout(timeoutA)
   clearTimeout(timeoutB)
})


//--------------------------------

let timeoutA: string;
let timeoutB: string;

onMount(() => {
   timeoutA = setTimeout(() => {
      console.log('time up!')
   }, 100),

      timeoutB = setTimeout(() => {
         console.log('time up!')
      }, 100)
})


onUnmount(() => {
   clearTimeout(timeoutA)
   clearTimeout(timeoutB)
})


//----------------------------------

const attendant = asyncTask(task =>
   document.addEventListener('click', task), e => {
      console.log(e)
   }, {
   remove: task => document.removeEventListener('click', task),
})

// attendant.stop()
// attendant.resume()

document.addEventListener('click', doThis)

$thisFlask().on({
   activate: () => document.addEventListener('click', doThis),
   discard: () => document.removeEventListener('click', doThis)
})

function doThis(e) {
   console.log(e)
}

// but what if you need to re-run the handler if it's dirty? like watchers