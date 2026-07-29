//@ts-nocheck
import { component, atAttach, beforeDetach, template } from "luent";
import { Ion } from "@luent/quarky";
import { resolve } from "path";

export function DinoLogo() {
   // # init animation

   const $active = ion({ active: false }, {
      set(value) {

      }
   })

   const $count = ion(0,
      {
         get double() {
            return this() * 2
         },
         increment() {
            this.value++
         },
         decrement() {
            this.value--
         }
      })

   const $count = ion({ count: 0 }, {
      increment() {
         this.count++
      },
      decrement() {
         this.count--
      }
   })

   const $todos = ion({ todos: ionize([] as Todo[]) })

   const $todos = ion(ionize([] as Todo[]))

   const $todos = ion({ todos: ionize([] as Todo[]) }, {
      addTodo(todo: Todo) {
         this.todos.push(todo)
      },
      removeTodo(todo: Todo) {
         this.todos.push(todo)
      }
   })

   const $todos = ion(ionize([] as Todo[]), {
      addTodo(todo: Todo) {
         this.todos.push(todo)
      },
      removeTodo(todo: Todo) {
         this.todos.push(todo)
      }
   })

   const animation = concatStreams([
      running,
      running,
      $blink
   ], {
      timer: {
         delay: 5000,
         x: 1000,
      },
      until: beforeDetach
   })

   animation.start();


   // parallelStreams([$running, $side], {
   //    timer: { x: 2 }
   // }),

   // # animate

   // function animate() {
   //    return new Promise<void>(end =>
   //       Timeout(async () => {
   //          await run()
   //          blink()
   //          end()
   //       }, {
   //          time: 5000,
   //          until: beforeDetach,
   //       })
   //    )
   // }


   // # animate parts

   const $blink = StreamIon(false, {
      this: { count: 0 },
      run() {
         $blink.value = true;
         this.count++
      },
      interval: 500,
      doWhile: () => this.count === 3,
      '@end'() {
         this.value = true
      }
   })

   const obj = {
      increment() {

      }
   }

   function m<T>(arg: T): T {
      return arg;
   }

   $(obj).increment()


   const $blink = StreamIon({
      value: false,
      context: {
         count: 0
      },
      timer: {  // can pass array of timers too
         delay: 50,
         run(context) {
            this.value = !this.value;
         },
         interval: 500,
         x: 6,
         '@end'() {
            this.value = false
         }
      }
   }, {
      '@start': () => { },
      reset() {
         // TODO: how to access context??
         this.value = false;
      },
   })

   const $blink = StreamIon({
      service: true, // does not stop when component is discarded
      value: false,
      this: { count: 0 },
      timer: {  // can pass array of timers too
         delay: 50,
         run() {
            this.value = !this.value;
         },
         interval: 500,
         x: 6,
         end() {
            this.value = true
         }
      }
   }, {
      reset() {
         this.value = false;
      },
   })


   const $blink = StreamIon({
      value: false,
      timer: {  // can pass array of timers too
         start() {
            this.value = !this.value;
         },
         interval: 500,
         x: 6,
         end() {
            this.value = true
         }
      }
   })

   const $running = StreamIon({
      value: 0,
      timer: {
         start() {
            this.value++
         },
         interval: 100,
         x: 4,
         end() {
            this.value = 0
         }
      }
   })

   const $side = StreamIon({
      value: 'l',
      timer: {
         run() {
            this.value++
         },
         interval: 200,
         x: 4,
         end() {
            this.value = 0
         }
      }
   })

   const running = Stream({
      this: ionize({
         leg: 1,
         side: 'l'
      }),
      timer: {
         run(x) {
            this.leg = x % 2 === 0 ? 2 : 1
            this.side = x > 20 ? 'r' : 'l'
         },
         interval: 100, // number | 'animation'
         x: 40
      }
   })

   type AsyncIon<T> = Ionized<Ion<T>>

   const $messages = AsyncIon({
      value: [],
      await: async () => fetch('/messages'),
      ionize
   }, {
      post(msg) {
         this.value.push(msg);

         dispatchPost(msg) // throttled
            .then(() => {
               msg.pending = false;
            })
            .catch(err => {
               msg.error = err;
            })
      }
   })


   const $messages = AsyncIon(ionize([]), () => fetch('/messages'), { // TODO: AsyncIon must remember initial ionizer
      post(msg) {
         this.value.push(msg);

         dispatchPost(msg) // throttled
            .then(() => {
               msg.pending = false;
            })
            .catch(err => {
               msg.error = err;
            })
      }
   })



   function blink() {
      let count = 0
      const interval =
         setInterval(() => {
            $blink.value = true
            count++;
            if (count === 3) {
               clearInterval(interval)
               $blink.value = true
            }
         }, 500)
      beforeDetach(() => {
         clearInterval(interval)
      })
   }


   function blinkB() {
      Interval(() => {
         $blink.value = true;
         this.count++
         if (this.count === 3) {
            this.end()
            $blink.value = true
         }
      }, {
         state: { count: 0 },
         interval: 500,
         until: beforeDetach
      })


      let count = 0
      const interval =
         setInterval(() => {
            $blink.value = true
            count++;
            if (count === 3) {
               clearInterval(interval)
               $blink.value = true
            }
         }, 500)
      beforeDetach(() => {
         clearInterval(interval)
      })
   }

   const $running = ion(false)
   const $side = ion('l' as 'l' | 'r')

   function run() {
      return new Promise<void>(end => {
         let count = 0
         const interval =
            setInterval(() => {
               $running.value = true
               count++;
               if (count === 3) {
                  clearInterval(interval)
                  $running.value = true
                  end()
               }
            }, 500)
         beforeDetach(() => {
            clearInterval(interval)
         })
      })
   }


   // # classes

   // ($blink() ? “blink” : “open-eyed”)

   return (

      <>
      </>
   )

}