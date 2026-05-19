//@ts-nocheck


// destructurable singleton
const useCounterKit = asShared(CounterKit, { ephemeral: true })

// kit
function CounterKit(initialCount: number) {

   const $count = ion(0)
   const $doubleCount = ion(0)

   function incrementCount() {
      $count.value++
   }

   function decrementCount() {
      $count.value--
   }

   return {
      $count,
      $doubleCount,
      incrementCount,
      decrementCount
   }
}

class Counter {

   constructor(initialValue: number) {
      this.count = initialValue;
   }

   get doubleCount() {
      return this.count * 2
   }

   increment() {
      this.count++
   }

   decrement() {
      this.count--
   }
}

const useCounter = asShared(Counter, { class: true }) 



const useIonizedCounter = asShared(IonizedCounter) 


defineIonicCollective(AnimationController, {
   getSomething: {
      input: i => raw(i),
      output: o => ionize(o),
      this: t => rawDecoy(t),
      track: (model, input) => [model, 'getSomething', input[0]] // track op
   },
   filter: {
      track: model => [model]
   }
})

interface AnimationController {
   getSomething(): MaybeIonized<>
}


// // factory
// function IonizedCounter(initialValue: number) {

//    return ionize({
//       count: initialValue,

//       get doubleCount() {
//          return this.count * 2
//       },

//       increment() {
//          this.count++
//       },

//       decrement() {
//          this.count--
//       }
//    })
// }

// // ionized model factory //DEPRECATED
// const IonizedCounter = defineIonized('Counter', {

//    factory(intialCount: number) {
//       return {
//          count: intialCount,

//          get doubleCount() {
//             return this.count * 2
//          }
//       }
//    },

//    increment() {
//       this.count++
//    },

//    decrement() {
//       this.count--
//    }

// })

// function $Count(initialValue: number) {  //DEPRECATED

//    return ion(initialValue, {

//       increment() {
//          this.value++
//       },

//       decrement() {
//          this.value--
//       }
//    })
// }


// singleton
// const useCountIon = defineSharedIon('Count', { //DEPRECATED

//    factory(initialCount: number) {
//       return { count: initialCount } // must have only one property
//    },

//    increment() {
//       this.count++
//    },

//    decrement() {
//       this.count--
//    }
// })

// ion capsule factory
// const CountIon = defineIon('Count', { //DEPRECATED

//    factory(initialCount: number) {
//       return { count: initialCount } // must have only one property
//    },

//    increment() {
//       this.count++
//    },

//    decrement() {
//       this.count--
//    }
// })


// class IonizedCounter { //DEPRECATED

//    constructor(initialValue: number) {
//       this.count = initialValue;

//       return ionize(this)
//    }

//    get doubleCount() {
//       return this.count * 2
//    }

//    increment() {
//       this.count++
//    }

//    decrement() {
//       this.count--
//    }
// }

watchItems()

// watchMutable(list, mutations => { //DEPRECATED

// })

// watchMutableItems(listen, () => {

// })



// ion
// ion.ionize
// ionize
// ionize.deep
// ion.ionize.deep

// areSame

// inert
// raw
