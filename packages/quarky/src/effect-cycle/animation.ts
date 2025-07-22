import { $_wrap_with_context } from "@rue/flask";

let forAnimation = false;
export function $forAnimation() {
   return forAnimation
}

export function prioritize(fn: Function) {
   forAnimation = true;
   fn()
   forAnimation = false;
}

/**
 * Throttle by animation frame across mouse events like mouse enter and mouse leave
 */
export function useSharedRenderThrottle() {
   return function Throttled(fn: Function) {
      let frameID: number | null = null

      return function throttled() {
         if (frameID !== null) return;
         frameID = requestAnimationFrame(() => {
            setImmediate(() => {
               frameID = null;
               forAnimation = true;
               fn(); // Execute the original function with its context and arguments
               forAnimation = false;
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
export function ThrottledRender(fn: Function) {
   let frameID: number | null = null

   return function throttled() {
      if (frameID !== null) return;
      frameID = requestAnimationFrame(() => {
         setImmediate(() => {
            frameID = null;
            forAnimation = true;
            fn(); // Execute the original function with its context and arguments
            forAnimation = false;
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

   function renderFrame(time: DOMHighResTimeStamp) {
      //TODO: maybe warn if time between animation frame and setImmediate is too long
      setImmediate(() => {
         forAnimation = true;
         prepFrame(time)
         forAnimation = false;
      })
   }

   function prepFrame(time: DOMHighResTimeStamp | undefined) {
      fn(time)
      if (stopped) return;
      nextFrame = requestAnimationFrame(renderFrame)
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