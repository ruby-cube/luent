import { template, FromTag, atUnmount } from "@rue/luent";
import { Animation, Interval, Ion, swiftUpdate, HeavyUpdate, queueTask, Suspense, o, } from "@rue/quarky";
import './SierpinskiTriangles.css'

// Modified Demo from Solid.js / React Fiber

// TODO:
// - time warning for lazy update
// - pState for consistency, how to keep lazy state consistent with 'watch() derivations'?
//QUESTION:
// - async effects?
// - when to cancel, when to queue?

const TARGET = 25;



// Types of update delays
// - expensive work or fetches in original task
// - expensive work or fetches in prelude effects
// - many prelude effects

// QUESTION: Should these be handled in one API or two?


// prerender
// beforehand
// in the meantime
// standin
// immediate
// swift
// sync


export function TriangleDemo() {
   const $elapsed = Ion(0)
   const $seconds = Ion(0)
   // const $realSeconds = Ion(0)
   // const $delta = Ion(() => ($realSeconds() - $seconds()))

   const $scale = Ion(() => {
      const e = ($elapsed() / 1000) % 10;
      return 1 + (e > 5 ? 10 - e : e) / 10;
   })

   // const incrementSeconds = Action({
   //    meantime: () => $realSeconds.value = ($seconds() % 10) + 1,
   //    dispatch: () => $seconds.value = ($seconds() % 10) + 1
   // })

   // incrementSeconds.$pending
   // incrementSeconds.dispatch()


   const incrementSeconds = HeavyUpdate(() =>
      $seconds.value = ($seconds() % 10) + 1
   )

   const secondsStream = Interval(1000, () => {
      incrementSeconds()
      // $seconds.value = ($seconds() % 10) + 1
   }).start();

   const start = Date.now()

   const animation = Animation(() => {
      $elapsed.value = Date.now() - start;
   }).start()

   atUnmount(() => {
      secondsStream.stop();
      animation.stop();
   });

   function stop() {
      secondsStream.stop();
      animation.stop()
   }

   function reset() {
      secondsStream.stop()
      // dispatch(() => {
      //    $seconds.value = 0
      // }, { deadline: 1000 }) // TODO: reset is inconsistent without lazy update (solid.js has the same problem)
         $seconds.value = 0
      secondsStream.start()
   }
   // const $suspense = Suspense()

   return template(
      <>
         {/* <div style={['border-radius: 50%; background-color: green; position: absolute; left: 0; width: 10px; height: 10px', {transform: (`translate(${$x()}px, ${$y()}px)`)}]}></div> */}
         <div>
            {/* <p>cancel count: {$cancelCount} | real secs: {$realSeconds} | delta: {$delta}</p> */}
            <button on:click={stop}>
               stop
            </button>
            <button on:click={e => (
               secondsStream.start(),
               animation.start()
            )}>
               play
            </button>
            <button on:click={reset}>
               reset
            </button>
            <div
               class="container"
               style={{ transform: ("scaleX(" + $scale() / 2.1 + ") scaleY(0.7) translateZ(0.1px)") }}
            >
               {/* {Await( */}
               <Triangle x={0} y={0} s={1000} seconds={$seconds} /* suspense={$suspense} */ />
               {/* )} */}
            </div>
         </div>
      </>
   );
};

let $slowCount = 0

function Triangle({ x, y, s, $seconds, /* $suspense  */}: FromTag<any>) {
   if (s <= TARGET) {
      return template(
         <Dot x={x - TARGET / 2} y={y - TARGET / 2} s={TARGET}
            // text={(o.await($suspense, $seconds))}
         text={$seconds}
         ></Dot>
      );
   }
   s = s / 2;

   $slowCount++
   // const $slow = Ion(0, {
   //    // awaited: true 
   //    '-fetch': () => {
   //       const sec = $seconds()
   //       // let id;
   //       const worker = new Promise(resolve => {
   //          // if (id) cancelIdleCallback(id)
   //          // id = requestIdleCallback(() => {
   //          //    var e = performance.now() + 0.8;
   //          //    // Artificially long execution time.
   //          //    while (performance.now() < e) { }
   //          //    resolve(sec);
   //          // })
   //          setTimeout(() => {
   //             resolve(sec);
   //          }, Math.random() * 100);
   //       })
   //       return worker
   //    },
   //    '-suspend': $suspense
   // })

   const $slow = Ion(() => {
      // console.time('a')
      var e = performance.now() + 0.8;
      // Artificially long execution time.
      while (performance.now() < e) { }
      // console.timeEnd('a')
      return $seconds()
   })

   return template(
      <>
         <Triangle x={x} y={y - s / 2} s={s} seconds={$slow} /* suspense={$suspense}  *//>
         <Triangle x={x - s} y={y + s / 2} s={s} seconds={$slow} /* suspense={$suspense} */ />
         <Triangle x={x + s} y={y + s / 2} s={s} seconds={$slow} /* suspense={$suspense} */ />
      </>
   );
};


// 729 dots

function Dot({ x, y, s, $text }: FromTag<any>) {
   const $hover = Ion(false)

   return template(
      <div
         class="dot"
         style={{
            // color: "#61dafb",
            width: s + "px",
            height: s + "px",
            left: x + "px",
            top: y + "px",
            "border-radius": s / 2 + "px",
            "line-height": s + "px",
            background: ($hover() ? "#ff0" : "#61dafb")
         }}
         on:mouseenter={e => $hover.value = true}
         on:mouseleave={e => $hover.value = false}
      >{($hover() ? "**" + $text() + "**" : $text())}</div>
   );
};


