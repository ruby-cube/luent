
if (import.meta.env.DEV && !__TEST__) {
   // lazy import to prevent imports from affecting tests
   import('./demos').then(res => res.runDemo())
}

// const $count = ion(0)

// document.addEventListener('click', () => {
//    swiftUpdate(() => {
//       $count.value++
//    })
// })

// observe($count, () => {
//    console.log('SYNC $count', $count())
// }, { phase: SYNC })

// observe($count, () => {
//    console.log('PRELUDE $count', $count())
// }, { phase: PRELUDE })

// observe($count, () => {
//    console.log('RENDER $count', $count())
// }, { phase: RENDER })

// observe($count, () => {
//    console.log('LAYOUT $count', $count())
// }, { phase: LAYOUT })

// observe($count, () => {
//    console.log('TICK $count', $count())
// }, { phase: TICK })