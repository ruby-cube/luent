
if (import.meta.env.DEV) {
   // lazy import to prevent imports from affecting tests
   import('./demos').then(res => res.runDemo())
}

// const $count = ion(0)

// document.addEventListener('click', () => {
//    swiftUpdate(() => {
//       $count.value++
//    })
// })

// watch($count, () => {
//    console.log('SYNC $count', $count())
// }, { phase: SYNC })

// watch($count, () => {
//    console.log('PRELUDE $count', $count())
// }, { phase: PRELUDE })

// watch($count, () => {
//    console.log('RENDER $count', $count())
// }, { phase: RENDER })

// watch($count, () => {
//    console.log('LAYOUT $count', $count())
// }, { phase: LAYOUT })

// watch($count, () => {
//    console.log('TICK $count', $count())
// }, { phase: TICK })