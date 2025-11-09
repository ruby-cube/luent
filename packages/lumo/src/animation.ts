import { $_run_with_, $_snap_context, $_wrap_with_context } from "@rue/flask";
import { pushUpdate, popUpdate, Update, UpdateType, catchCancelledUpdate } from "@rue/quarky";

// let forAnimation = false;
// export function $forAnimation() {
//    return forAnimation
// }

// export function prioritize(fn: Function) {
//    forAnimation = true;
//    fn()
//    forAnimation = false;
// }

/**
 * Throttle by animation frame across mouse events like mouse enter and mouse leave
 */
export function ThrottledHover() {
   let hoverID: number | null = null
   let unhoverID: number | null = null

   return [function Hover(fn: <T>(e: T) => void) {

      return function hover<T>(e: T) {
         if (unhoverID !== null) cancelAnimationFrame(unhoverID)
         if (hoverID !== null) cancelAnimationFrame(hoverID)
         hoverID = requestAnimationFrame(() => {
            // setImmediate(() => {
            hoverID = null;
            const update = new Update(UpdateType.USER_ANIMATION, 16.7)
            try {
               pushUpdate(update)
               fn(e); // Execute the original function with its context and arguments
            }
            catch (err) {
               catchCancelledUpdate(err)
            }
            finally {
               popUpdate()
            }
            // })
         })
         // Otherwise, the function call is ignored (throttled)
      };
   },
   function Unhover(fn: <T>(e: T) => void) {

      return function unhover<T>(e: T) {
         if (unhoverID !== null) cancelAnimationFrame(unhoverID)
         if (hoverID !== null) cancelAnimationFrame(hoverID)
         unhoverID = requestAnimationFrame(() => {
            // setImmediate(() => {
            unhoverID = null;
            const update = new Update(UpdateType.USER_ANIMATION, 16.7)
            try {
               pushUpdate(update)
               fn(e); // Execute the original function with its context and arguments
            }
            catch (err) {
               catchCancelledUpdate(err)
            }
            finally {
               popUpdate()
            }
            // })
         })
         // Otherwise, the function call is ignored (throttled)
      };
   }]
}

/**
 * Throttle by animation frame across mouse events like mouse enter and mouse leave
 */
export function SharedThrottledUpdate() {
   let frameID: number | null = null

   return function Throttled(fn: Function) {

      return function throttled() {
         if (frameID !== null) return;
         frameID = requestAnimationFrame(() => {
            setImmediate(() => {
               frameID = null;
               const update = new Update(UpdateType.USER_ANIMATION, 16.7)
               try {
                  pushUpdate(update)
                  fn(); // Execute the original function with its context and arguments
               }
               finally {
                  popUpdate()
               }
            })
         })
         // Otherwise, the function call is ignored (throttled)
      };
   }
}

/**
 * Throttled by animation frame
 * @param fn 
 * @returns 
 */
export function ThrottlePointer(fn: Function) {
   let frameID: number | null = null

   return function throttled(e: MouseEvent) {
      if (frameID !== null) cancelAnimationFrame(frameID)
      frameID = requestAnimationFrame(() => {
         frameID = null;
         const update = new Update(UpdateType.USER_ANIMATION, 16.7)
         try {
            pushUpdate(update)
            fn(e); // Execute the original function with its context and arguments
         }
         catch (err) {
            catchCancelledUpdate(err)
         }
         finally {
            popUpdate()
         }
      })
      // Otherwise, the function call is ignored (throttled)
   };
}
/**
 * Throttled by animation frame
 * @param fn 
 * @returns 
 */
export function ThrottledUpdate(fn: Function) {
   let frameID: number | null = null

   return function throttled() {
      if (frameID !== null) return;
      frameID = requestAnimationFrame(() => {
         setImmediate(() => {
            frameID = null;
            const update = new Update(UpdateType.USER_ANIMATION, 16.7)
            try {
               pushUpdate(update)
               fn(); // Execute the original function with its context and arguments
            }
            catch (err) {
               catchCancelledUpdate(err)
            }
            finally {
               popUpdate()
            }
         })
      })
      // Otherwise, the function call is ignored (throttled)
   };
}


// export function Throttled(fn: Function) {
//    let lastExecutionTime = 0; // Stores the timestamp of the last function execution

//    return function throttled() {
//       const currentTime = Date.now(); // Get the current timestamp

//       // If enough time has passed since the last execution, execute the function
//       if (currentTime - lastExecutionTime >= 16.7) {
//          forAnimation = true;
//          fn(); // Execute the original function with its context and arguments
//          forAnimation = false;
//          lastExecutionTime = currentTime; // Update the last execution time
//       }
//       // Otherwise, the function call is ignored (throttled)
//    };
// }


export function Interval(fn: () => void, interval: number) {

   let timeout: undefined | NodeJS.Timeout = undefined
   let stopped = true;
   const fnWithContext = $_wrap_with_context(fn)

   return {
      stop() {
         stopped = true;
         if (timeout) clearInterval(timeout)
      },
      start() {
         if (!stopped) return this;
         stopped = false;
         timeout = setInterval(fnWithContext, interval)
         return this;
      }
   }
}

export function Animation(fn: (time: DOMHighResTimeStamp | undefined) => void) {

   let nextFrame: undefined | number = undefined
   let stopped = true;
   const context = $_snap_context()



   function renderFrame(time: DOMHighResTimeStamp) {
      setImmediate(() => {
         try {
            const update = new Update(stopped ? UpdateType.USER_ANIMATION /* FIX: this should actually depend on the outer update type */ : UpdateType.BACKGROUND_ANIMATION, 16.7)
            pushUpdate(update)
            prepFrame(time)
         }
         catch (err) {
            catchCancelledUpdate(err)
         }
         finally {
            popUpdate()
         }
      })
   }

   function prepFrame(time: DOMHighResTimeStamp | undefined) {
      try {
         $_run_with_(context, () => fn(time))
      }
      finally {
         if (stopped) return;
         nextFrame = requestAnimationFrame(renderFrame)
      }
   }

   return {
      stop() {
         stopped = true;
         if (nextFrame) cancelAnimationFrame(nextFrame)
      },
      start() {
         if (!stopped) return this;
         stopped = false;
         requestAnimationFrame(renderFrame)
         return this;
      }
   }
}