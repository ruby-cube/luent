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
   let frameID: number | null = null
   return function Throttled(fn: Function) {

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

export function animate(fn: (time: DOMHighResTimeStamp | undefined) => void) {
   const animation = {
      nextFrame: undefined as undefined | number
   }

   requestAnimationFrame(renderFrame)

   function renderFrame(time: DOMHighResTimeStamp) {
      setImmediate(() => {
         forAnimation = true;
         prepFrame(time)
         forAnimation = false;
      })
   }

   function prepFrame(time: DOMHighResTimeStamp | undefined) {
      fn(time)
      animation.nextFrame = requestAnimationFrame(renderFrame)
   }

   return animation
}