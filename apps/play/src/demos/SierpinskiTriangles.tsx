import { component, fromTag, atUnmount, PRERENDER, POSTRENDER } from "@rue/lumo";
import { $currentCycle, Animation, EffectCycle, EffectCycleManager, Interval, ion, useLazyUpdate, useSharedRenderThrottle, watch } from "@rue/quarky";

//TODO:
// - time warning for lazy update
// - tState for consistency, how to keep lazy state consistent with 'watch() derivations'?
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

const lazyBatch = useLazyBatch()


const upd1000 = useLazyUpdate(1000)

export function TriangleDemo() {
   const $elapsed = ion(0)
   const $seconds = ion(0)

   const $scale = ion(() => {
      const e = ($elapsed() / 1000) % 10;
      return 1 + (e > 5 ? 10 - e : e) / 10;
   })
   const start = Date.now()

   const secondsInterval = Interval(() => upd1000(() => ($seconds.state = ($seconds() % 10) + 1)), 1000).start();
   // t = setInterval(() => startTransition(() => $seconds.state = ($seconds() % 10) + 1), 1000);

   const animation = Animation(() => {
      $elapsed.state = Date.now() - start;
   }).start()

   atUnmount(() => {
      secondsInterval.stop();
      animation.stop();
   });

   // watch($seconds, () => {
   //    console.log('changed', $seconds())
   // }, { phase: POSTRENDER })

   function stop() {
      secondsInterval.stop(); 
      animation.stop()
      // for (const log of window.__DEV__log) {
      //    console.log(log)
      // }
      // window.__DEV__log.length = 0;
   }

   return component(
      <>
         <button on:click={stop}>stop</button>
         <button on:click={e => (
            secondsInterval.start(),
            animation.start()
            )}>play</button>
         <div
            class="container"
            style={{
               transform: function $drv() {
                  return "scaleX(" + $scale() / 2.1 + ") scaleY(0.7) translateZ(0.1px)"
               }
            }}
         >
            {/* <div>{$seconds}</div> */}
            <Triangle x={0} y={0} s={1000} seconds={$seconds} />
         </div>
      </>
   );
};

function Triangle({ x, y, s, $seconds } = fromTag<any>()) {
   if (s <= TARGET) {
      return component(
         <Dot x={x - TARGET / 2} y={y - TARGET / 2} s={TARGET} text={$seconds} />
      );
   }
   s = s / 2;

   // const $slow = ion($seconds())

   // // SOLUTION: segregate long derivation from rendering with watch() prerender, 

   // watch($seconds, async () => {
   //    await lazyBatch(() => {
   //       var e = performance.now() + 0.8;
   //       // Artificially long execution time.
   //       while (performance.now() < e) { }
   //    })
   //    $slow.state = $seconds()
   // }, { phase: PRERENDER }) // phase doesn't really matter since await makes this into a separate task


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


function Dot({ x, y, s, $text } = fromTag<any>()) {
   const $hover = ion(false)

   const Throttled = useSharedRenderThrottle()

   const hover = Throttled(() => $hover.state = true)
   const unhover = Throttled(() => $hover.state = false)


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
