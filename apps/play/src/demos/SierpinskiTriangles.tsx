import { component, fromTag, atUnmount, PRERENDER, POSTRENDER } from "@rue/lumo";
import { animate, ion, Throttled, watch } from "@rue/quarky";

const TARGET = 25;

function doAction(fn: Function) {
   return fn()
}




// function renderLazily(mutation: Function, deadline?: number) {

// }

// function renderAnimationFrame() {

// }
const lazyBatch = useLazyBatch()

export function TriangleDemo() {
   const $elapsed = ion(0)
   const $seconds = ion(0)

   const $scale = ion(() => {
      const e = ($elapsed() / 1000) % 10;
      return 1 + (e > 5 ? 10 - e : e) / 10;
   })
   const start = Date.now()
   const t = setInterval(() =>  $seconds.state = ($seconds() % 10) + 1, 1000);
   // t = setInterval(() => startTransition(() => $seconds.state = ($seconds() % 10) + 1), 1000);

   const animation = animate(() => {
      $elapsed.state = Date.now() - start;
   })

   atUnmount(() => {
      clearInterval(t); cancelAnimationFrame(animation.nextFrame!);
   });

   // watch($seconds, () => {
   //    console.log('changed', $seconds())
   // }, { phase: POSTRENDER })

   return component(
      <div
         class="container"
         style={{
            transform: ("scaleX(" + $scale() / 2.1 + ") scaleY(0.7) translateZ(0.1px)")
         }}
      >
         {/* <div>{$seconds}</div> */}
         <Triangle x={0} y={0} s={1000} seconds={$seconds} />
      </div>
   );
};

function Triangle({ x, y, s, $seconds } = fromTag<any>()) {
   if (s <= TARGET) {
      return component(
         <Dot x={x - TARGET / 2} y={y - TARGET / 2} s={TARGET} text={$seconds} />
      );
   }
   s = s / 2;

   const $slow = ion($seconds())

   // SOLUTION: segregate long derivation from rendering with watch() prerender, 

   watch($seconds, async () => {
      await lazyBatch(() => {
         var e = performance.now() + 0.8;
         // Artificially long execution time.
         while (performance.now() < e) { }
      })
      $slow.state = $seconds()
   }, { phase: PRERENDER }) // phase doesn't really matter since await makes this into a separate task

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
            for (let i = 0; i < idleTasks!.length; i++) {
               // const resolve = resolvers![i]
               const task = idleTasks![i]
               requestIdleCallback((deadline) => {
                  task()
                  if (i === limit - 1) {
                     resolvers?.forEach(resolve => resolve(undefined))
                     resolvers = undefined
                  }
               })
            }
            idleTasks = undefined;
            // emitMeasureLayoutComplete()
         })
         return new Promise((_resolve) => {
            resolvers!.push(_resolve)
         })
      }
   }
}
