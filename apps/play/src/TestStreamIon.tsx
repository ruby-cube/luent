//@ts-nocheck
import { component, ComposedStream, startStream, stopStream, asStream, atUnmount } from "@rue/lumo";
import './TestStreamIon.css'
import { Ion } from "@rue/quarky";

export function TestStreamIon() {

   const $bugeye = asStream({
      this: Ion(false),
      stream: {
         '@pre'() { this.value = true },
         interval: 500,
         run(o) { this.value = !this.value },
         '@post'() { this.value = false },
         max: 5,
      }
   })

   const bugeye = Stream({
      '@pre'() { $bugeye.value = true },
      interval: 500,
      run(o) { $bugeye.value = !this.value },
      '@post'() { $bugeye.value = false },
      max: 5,
   })


   const $bugeye = Ion(1, {
      bug() { this.value = 2 },
      reset() { this.value = 1 },
      toggle() { this.value = this.value === 1 ? 2 : 1 }
   });

   // const bugeye = Stream(({ interval, sequence, onStop }) => {

   //    onStop(() => $bugeye.reset())

   //    return sequence(
   //       () => $bugeye.bug(),
   //       repeat(5,
   //          interval(500, () => $bugeye.toggle())
   //       ),
   //       () => $bugeye.reset(),
   //    )
   // })

   const bugeye = Stream(({ interval, sequence, onStop }) => {
      let x = 0

      return sequence(
         ($bugeye.bug),
         does(
            interval(500, () => {
               $bugeye.toggle()
               x++
            }),
         ).til(() => x === 5),
         ($bugeye.reset),
         onStop(() => $bugeye.reset())
      )
   })

   function animate() {
      let x = 5;

      return {
         async start() {
            $eye.bug()

            while (x--) {
               await __delay(500);
               $eye.toggle()
            }
            $eye.reset()
         },
         stop() {
            x = 0;
            $eye.reset()
         }
      }
   }

   function bugeye() {
      let x = 5;

      run(async () => {
         $eye.bug()

         while (x--) {
            await __delay(500);
            $eye.toggle()
         }
         $eye.reset()
      })

      return {
         stop() {
            x = 0;
            $eye.reset()
         }
      }
   }


   function animate() {


      return {
         async start() {
            await __(run.start(), turn.start())
            bugeye.start()
         },
         stop() {

         }
      }
   }

   const animation = Stream(async () => {
      let x = 5
      while (x--) {
         await settle(run, turn)
         bugeye.start()
      }
   })



   // Watch
   // Listen
   // Prerender

   const [bugeye, $eye] = Stream(({ Interval, Sequence, onStop }) => {

      const $eye = Ion(1, {
         bug() { this.value = 2 },
         reset() { this.value = 1 },
         toggle() { this.value = this.value === 1 ? 2 : 1 }
      });

      let x = 0

      return {
         bugeye: Sequence(
            Run(() => { $eye.bug() }),
            While(() => x === 5,
               Interval(500, () => {
                  $eye.toggle()
                  x++
               })
            ),
            Check(
               If(() => x > 10, () => this.stop()),
               Else(() => $eye.bug())
            ),
            Run(() => { $eye.reset() }),
            onStop(() => $eye.reset())
         ),
         $eye
      }
   }, { stop: atUnmount })

   const dragging = Stream(() => {

      const mousemove = Listen($div(), 'mousemove', () => {

      })

      const mouseup = Sequence(
         Listen($div(), 'mouseup', () => {
            mousemove.stop()
         }),
         Wait(500, () => {

         })
      )

      return Merge(
         mousemove,
         mouseup
      )
   })

   function dragging() {
      const mousemove = listen(target, 'mousemove', () => {

      })

      listen(target, 'mousemove', async () => {
         mousemove.stop()
         await __delay(500)

      })
   }

   const bugeye = Stream(({ interval, sequence, onStop }) => {
      let x = 0

      return (
         sequence(
            o => { $bugeye.bug() },
            til(() => x === 5,
               interval(500, () => {
                  $bugeye.toggle()
                  x++
               })
            ),
            o => { $bugeye.reset() },
            onStop(() => $bugeye.reset())
         )
      )
   })

   const bugeye = Stream(() => {
      let x = 0
      return (
         Sequence(
            o => { $bugeye.bug() },
            Until(() => x === 5,
               Interval(500, () => {
                  $bugeye.toggle()
                  x++
               })
            ),
            o => { $bugeye.reset() },
            onStop(() => $bugeye.reset())
         )
      )
   })

   const bugeye = Stream(({ Sequence, Until, Interval, onStop }) =>
      Sequence(
         o => { $bugeye.bug() },
         Until(() => x === 5,
            Interval(500, () => {
               $bugeye.toggle()
               x++
            })
         ),
         o => { $bugeye.reset() },
         onStop(() => $bugeye.reset())
      )
   )


   let x = 0

   const bugeye =
      Sequence(
         o => { $bugeye.bug() },
         Until(() => x === 5,
            Interval(500, () => {
               $bugeye.toggle()
               x++
            })
         ),
         o => { $bugeye.reset() },
         onStop(() => $bugeye.reset())
      )

   const bugeye = Stream(({ interval, sequence, onStop }) => {

      return sequence(
         () => $bugeye.value = true,
         repeat(5,
            interval(500, () => $bugeye.value = !$bugeye())
         ),
         () => $bugeye.value = false,
      )
   })


   // const $bugeye = StreamIon({
   //    value: false,
   //    timers: {
   //       'walk': {
   //          '@pre'() { this.value = true },
   //          interval: 500,
   //          run(o) { this.value = !this.value },
   //          max: 5,
   //       },
   //       'run': {
   //          '@pre'() { this.value = true },
   //          interval: 500,
   //          run(o) { this.value = !this.value },
   //          max: 5,
   //       }
   //    }
   // }, {
   //    walk() {
   //       startStream(this, 'walk')
   //    }
   // })


   // startStream($bugeye, 'a')
   // stopStream($bugeye)

   // const $bugeye = Ion(false, {
   //    start() {

   //    },
   //    stop() {

   //    }
   // })





   // const $bugeye = Stream({
   //    source: Ion(false),
   //    timer: {
   //       '@pre': value => true,
   //       interval: 500,
   //       run: value => !value,
   //       max: 4,
   //       '@post': value => false
   //    }
   // })

   // const $count = Ion(0, {

   // })

   // const $timer = Stream({
   //    source: $count,
   //    timer: {
   //       interval: 1000,
   //       run: value => value + 1
   //    }
   // }, {
   //    reset: value => 0
   // })

   const movingDino = Stream({
      context: 
   })


   const $side = asStream({
      this: Ion('l' as 'l' | 'r'),
      stream: {
         '@pre'() { this.value = 'r' },
         interval: 1000,
         run() { this.value = this.value === 'l' ? 'r' : 'l' },
         max: 3,
         '@post'() { this.value = 'l' }
      },
   })

   const $running = asStream({
      this: Ion(false as false | 3 | 4),
      stream: {
         '@pre'() { this.value = 3 },
         interval: 125,
         run() { this.value = this.value === 3 ? 4 : 3 },
         max: 32,
         '@post'() { this.value = false }
      }
   })

   // const $message = SuspenseIon(undefined, () => fetch('/message')) as any


   // const $automessage = StreamIon({
   //    value: "",
   //    stream: {
   //       interval: 500,
   //       run(o) { this.value += $message()[o.stream.x - 1] },
   //       doWhile: o => o.stream.x === $message().length
   //    }
   // })

   // $message.onResolve(() => startStream($automessage))


   // const animation = ComposedStream({
   //    stream: {
   //       delay: 500,
   //       run: ({ concat, merge }) =>
   //          concat(merge($side, $running), $bugeye)
   //       ,
   //       max: 5
   //    }
   // })

   // const $something = StreamIon()

   //TODO: add more config options to composed stream
   //TODO: until 
   //TODO: conditions and context
   //TODO: interval

   const animation = ComposedStream(({ sequence, merge, repeat, delay }) =>
      sequence(
         delay(1000),
         repeat(5,
            sequence(
               () => console.log('Begin!'),
               merge($side, $running),
               $bugeye,
               () => console.log('DONE!')
            )
         )
      )
   )

   // startComposedStream(({ sequence, pend }) =>
   //    sequence(
   //       pend($message),
   //       $automessage
   //    )
   // )

   const $frame = Ion(() =>
      $bugeye()
         ? 2
         : $running()
            ? $running()
            : 1
   )

   return component(
      <>
         <div class="logo">
            <div class={['bg dragon', (`${$side()}${$frame()}`)]}></div>
         </div>
         <button on:click={e => { startStream(animation) }}>start</button>
         <button on:click={e => { stopStream(animation) }}>stop</button>
      </>
   )
}

// function runStream(stream: Stream) {
//    stream.start()
// }

// function stopStream(stream: Stream) {
//    stream.stop()
// }

// function AnimationKit() {

//    const running = Stream({
//       this: 
//    })

//    return {

//    }
// }