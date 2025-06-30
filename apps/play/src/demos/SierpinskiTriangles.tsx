import { component, fromTag, measureLayout, onUnmount } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";
import { afterEffects } from "../../../../packages/lumo/src/render-cycle";

const TARGET = 25;

const lazyBatch = useBatchedIdleTasks()

export function TriangleDemo() {
   const $elapsed = ion(0)
   const $seconds = ion(0)
   const $scale = ion(() => {
      const e = ($elapsed() / 1000) % 10;
      return 1 + (e > 5 ? 10 - e : e) / 10;
   }),
      start = Date.now(),
      t = setInterval(() => $seconds.state = ($seconds() % 10) + 1, 1000);
   // t = setInterval(() => startTransition(() => $seconds.state = ($seconds() % 10) + 1), 1000);

   let f: any;
   const update = () => {
      $elapsed.state = Date.now() - start;
      f = requestAnimationFrame(update);
   };
   f = requestAnimationFrame(update);

   onUnmount(() => {
      clearInterval(t), cancelAnimationFrame(f);
   });

   return component(
      <div
         class="container"
         style={{
            transform: ("scaleX(" + $scale() / 2.1 + ") scaleY(0.7) translateZ(0.1px)")
         }}
      >
         <Triangle x={0} y={0} s={1000} seconds={$seconds} />
      </div>
   );
};

function Triangle({ x, y, s, $seconds } = fromTag<any>()) {
   if (s <= TARGET) {
      return component(
         <Dot x={x - TARGET / 2} y={y - TARGET / 2} s={TARGET*1.25} text={$seconds} />
      );
   }
   s = s / 2;

   const slow = ion($seconds())

   watch($seconds, async () => {
      await lazyBatch(async () => {
         var e = performance.now() + 0.8;
         // Artificially long execution time.
         while (performance.now() < e) { }
      })
      slow.state = $seconds()
   })

   return component(
      <>
         <Triangle x={x} y={y - s / 2} s={s} seconds={slow} />
         <Triangle x={x - s} y={y + s / 2} s={s} seconds={slow} />
         <Triangle x={x + s} y={y + s / 2} s={s} seconds={slow} />
      </>
   );
};

function Dot({ x, y, s, $text } = fromTag<any>()) {
   const $hover = ion(false),
      onEnter = () => $hover.state = true,
      onExit = () => $hover.state = false;

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
         on:mouseenter={onEnter}
         on:mouseleave={onExit}
      >{($hover() ? "**" + $text() + "**" : $text())}</div>
   );
};



function useBatchedIdleTasks(){
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
         afterEffects(() => {
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
