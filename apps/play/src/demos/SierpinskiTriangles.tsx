import { component, FromTag, atUnmount } from "@rue/lumo";
import { Animation, Interval, ion, update, ThrottledHover, ionize, $_derivation, ionic } from "@rue/quarky";
import './SierpinskiTriangles.css'

// TODO:
// - time warning for lazy update
// - pState for consistency, how to keep lazy state consistent with 'watch() derivations'?
//QUESTION:
// - async effects?
// - when to cancel, when to queue?

const TARGET = 25;

function doAction(fn: Function) {
   return fn()
}


// const updu1000 = useRenderer(1000)

// function renderLazily(mutation: Function, deadline?: number) {

// }

// function renderAnimationFrame() {

// }


export function TriangleDemo() {
   const $elapsed = ion(0)
   const $seconds = ion(0)

   const $scale = ion(() => {
      const e = ($elapsed() / 1000) % 10;
      return 1 + (e > 5 ? 10 - e : e) / 10;
   })
   const start = Date.now()

   const secondsInterval = Interval(() => {
      update(() => ($seconds.value = ($seconds() % 10) + 1), { lazy: 1000 })
   }, 1000).start();
   // t = setInterval(() => startTransition(() => $seconds.value = ($seconds() % 10) + 1), 1000);

   const animation = Animation(() => {
      $elapsed.value = Date.now() - start;
   }).start()

   // const $x = ion(0)
   // const $y = ion(0)
   // listen(document, 'mousemove', ThrottlePointer((e: MouseEvent) => {
   //    $x.value = e.clientX;
   //    $y.value = e.clientY;
   // }))

   atUnmount(() => {
      secondsInterval.stop();
      animation.stop();
   });

   // watch($seconds, () => {
   //    console.log('changed', $seconds())
   // }, { phase: POSTLUDE })

   function stop() {
      secondsInterval.stop();
      animation.stop()
   }

   function reset() {
      secondsInterval.stop()
      update(() => {
         $seconds.value = 0
      }, { lazy: 1000 }) // TODO: reset is inconsistent without lazy update (solid.js has the same problem)
      secondsInterval.start()
   }

   return component(
      <>
         {/* <div style={['border-radius: 50%; background-color: green; position: absolute; left: 0; width: 10px; height: 10px', {transform: (`translate(${$x()}px, ${$y()}px)`)}]}></div> */}
         <div>
            <button on:click={stop}>
               stop
            </button>
            <button on:click={e => (
               secondsInterval.start()
               ,
               animation.start()
            )}>
               play
            </button>
            <button on:click={reset}>
               reset
            </button>
            <div
               class="container"
               style={{
                  transform: ("scaleX(" + $scale() / 2.1 + ") scaleY(0.7) translateZ(0.1px)")
               }}
            >
               <Triangle x={0} y={0} s={1000} seconds={$seconds} />
            </div>
         </div>
      </>
   );
};

function Triangle({ x, y, s, $seconds }: FromTag<any>) {
   if (s <= TARGET) {
      return component(
         <Dot x={x - TARGET / 2} y={y - TARGET / 2} s={TARGET} text={$seconds} />
      );
   }
   s = s / 2;

   // const $slow = ion($seconds())

   // // SOLUTION: segregate long derivation from rendering with watch() prelude, 

   // watch($seconds, async () => {
   //    await lazyBatch(() => {
   //       var e = performance.now() + 0.8;
   //       // Artificially long execution time.
   //       while (performance.now() < e) { }
   //    })
   //    $slow.value = $seconds()
   // }, { phase: PRELUDE }) // phase doesn't really matter since await makes this into a separate task


   const $slow = ion(() => {
      var e = performance.now() + 0.8;
      // Artificially long execution time.
      while (performance.now() < e) { }
      return $seconds()
   })

   return component(
      <>
         <Triangle x={x} y={y - s / 2} s={s} seconds={$slow} />
         <Triangle x={x - s} y={y + s / 2} s={s} seconds={$slow} />
         <Triangle x={x + s} y={y + s / 2} s={s} seconds={$slow} />
      </>
   );
};


function Dot({ x, y, s, $text }: FromTag<any>) {
   const $hover = ion(false)

   const [Hover, Unhover] = ThrottledHover()
   // const Throttled = (fn: Function)=>fn

   // const hover = () => $hover.value = true
   // const unhover = () => $hover.value = false
   const hover = Hover(() => $hover.value = true)
   const unhover = Unhover(() => $hover.value = false)


   return component(
      <div
         class="dot"
         style={{
            width: s + "px",
            height: s + "px",
            left: x + "px",
            top: y + "px",
            "border-radius": s / 2 + "px",
            "line-height": s + "px",
            background: ($hover() ? "#ff0" : "#61dafb")
         }}
         on:mouseenter={hover}
         on:mouseleave={unhover}
      >{($hover() ? "**" + $text() + "**" : $text())}</div>
   );
};



function useLazyBatch() {
   let idleTasks: (() => any)[] | undefined = undefined
   let resolvers: ((value: any | PromiseLike<unknown>) => void)[] | undefined = undefined


   return function onIdle<T>(task: () => T): Promise<void> {
      if (idleTasks) {
         idleTasks.push(task)
         return new Promise((_resolve) => {
            resolvers!.push(_resolve)
         })
      } else {
         idleTasks = [task]
         resolvers = []
         queueMicrotask(() => {
            const limit = idleTasks!.length
            for (let i = 0; i < limit; i++) {
               const task = idleTasks![i]
               requestIdleCallback(() => {
                  try {
                     task()
                  }
                  finally {
                     if (i === limit - 1) {
                        resolvers?.forEach(resolve => resolve(undefined))
                        resolvers = undefined
                     }
                  }
               }, { timeout: 17 })
            }
            idleTasks = undefined;
         })
         return new Promise((_resolve) => {
            resolvers!.push(_resolve)
         })
      }
   }
}
