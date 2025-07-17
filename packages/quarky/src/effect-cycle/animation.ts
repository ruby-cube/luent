
let forAnimation = false;
export function $forAnimation(){
   return forAnimation;
}

export function animate(fn: (time: DOMHighResTimeStamp | undefined) => void) {
   const animation = {
      nextFrame: undefined as undefined | number
   }

   prepFrame(undefined)

   function renderFrame(time: DOMHighResTimeStamp) {
      setImmediate(() => {
         prepFrame(time)
      })
   }

   function prepFrame(time: DOMHighResTimeStamp | undefined) {
      forAnimation = true;
      fn(time)
      forAnimation = false;
      animation.nextFrame = requestAnimationFrame(renderFrame)
   }

   return animation
}