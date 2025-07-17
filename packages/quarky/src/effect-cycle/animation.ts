
export function animate(fn: (time: DOMHighResTimeStamp | undefined) => void) {
   const animation = {
      nextFrame: undefined as undefined | number
   }

   requestAnimationFrame(renderFrame)

   function renderFrame(time: DOMHighResTimeStamp) {
      setImmediate(() => {
         prepFrame(time)
      })
   }

   function prepFrame(time: DOMHighResTimeStamp | undefined) {
      fn(time)
      animation.nextFrame = requestAnimationFrame(renderFrame)
   }

   return animation
}