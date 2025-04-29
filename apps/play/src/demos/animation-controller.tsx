//@ts-nocheck
import { $thisView, component, If, NodeRef, ref, onInitialMount } from "@rue/lumo";
import { ion, ionize, isIonizedModel, queueTask, watch } from "@rue/quarky";
import { inert } from "../../../../packages/quarky/src/ionized/inert";

class AnimationAnimator {
   constructor(canvas) {
      this.canvas = inert(canvas);
      this.ctx = inert(canvas.getContext('2d'));
      console.log('ctx', this.ctx)
      this.squareSize = 50;
      this.startX = 0;
      this.endX = canvas.width - this.squareSize;
      this.y = (canvas.height - this.squareSize) / 2;
      this.animationDuration = 5000;
      this.startTime = null;
      this.animationFrame = null;
      this.elapsed = 0;
      this.pauseTime = null;
      this.isPlaying = false;
   }

   draw(currentX) {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw square
      this.ctx.fillStyle = '#3498db';
      this.ctx.fillRect(currentX, this.y, this.squareSize, this.squareSize);
   }

   animate(currentTime) {
      if (!this.startTime) {
         this.startTime = currentTime - this.elapsed;
      }

      // Calculate progress (0 to 1)
      this.elapsed = currentTime - this.startTime;
      const progress = Math.min(this.elapsed / this.animationDuration, 1);

      // Calculate current position
      const currentX = this.startX + (this.endX - this.startX) * progress;

      // Draw current frame
      this.draw(currentX);

      // Update slider if it exists
      const timeSlider = document.getElementById('timeSlider');
      if (timeSlider) {
         timeSlider.value = this.elapsed;
         const timeDisplay = document.getElementById('timeDisplay');
         if (timeDisplay) {
            timeDisplay.textContent = (this.elapsed / 1000).toFixed(1) + 's';
         }
      }

      // Continue animation if not complete
      if (progress < 1) {
         this.animationFrame = requestAnimationFrame(this.animate.bind(this));
      } else {
         this.stop();
         const playButton = document.getElementById('playButton');
         if (playButton) {
            playButton.textContent = 'Play';
         }
      }
   }

   play() {
      // Cancel any existing animation
      if (this.animationFrame) {
         cancelAnimationFrame(this.animationFrame);
      }

      // Reset start time but maintain elapsed time
      this.startTime = null;

      // Start animation
      this.animationFrame = requestAnimationFrame(this.animate.bind(this));
      this.isPlaying = true;
   }

   stop() {
      if (this.animationFrame) {
         cancelAnimationFrame(this.animationFrame);
         this.animationFrame = null;
      }
      this.isPlaying = false;
   }

   goToTime(timeMs) {
      // Stop any running animation
      this.stop();

      // Clamp time to animation duration
      const clampedTime = Math.max(0, Math.min(timeMs, this.animationDuration));

      // Update elapsed time
      this.elapsed = clampedTime;

      // Calculate progress and position
      const progress = this.elapsed / this.animationDuration;
      const currentX = this.startX + (this.endX - this.startX) * progress;

      // Draw frame at specified time
      this.draw(currentX);
   }
}

export function TestAnimationController() {

   const $canvas = ref('canvas')

   // const $animation = ion(() => $canvas() ? ionize(new AnimationAnimator(inert($canvas()))) : undefined)

   const $elapsed = ion(() => $animation()?.$elapsed() ?? 0)
   const $isPlaying = ion(() => $animation()?.$isPlaying() ?? false)
   const $animation = ion(undefined)

   function playPause() {
      const animation = $animation()
      if (animation.isPlaying) {
         animation.stop();
      } else {
         animation.play();
      }
   }

   function updateTime(e) {
      const animation = $animation()
      const timeMs = parseInt(e.target.value);
      animation.goToTime(timeMs);
   }



   function initAnimation(canvas) {
      console.log('on mount')
      const animation = $animation.state = ionize(new AnimationAnimator($canvas()))

      // debug.traceTriggers('# animation', animation, { canvas: true })

      // const list = ionize([])

      // animation.play()
      // $elapsed = animation.$elapsed
      // $isPlaying = animation.$isPlaying

      // queueTask(() => {
      // animation.play()
      // })


      // return {
      //    $isPlaying: animation.$isPlaying,
      //    $elapsed: animation.$elapsed,
      //    playPause,
      //    updateTime
      // };
   }

   setTimeout(initAnimation, 1)


   return component(
      <>
         <div style="display: flex; flex-direction: column; align-items: flex-start">
            <canvas ref={$canvas} post:mount={initAnimation} style="border: 1px solid black" width="600" height="200"></canvas>
            {/* {If($canvas, ({ $elapsed, $isPlaying, playPause, updateTime, play } = AnimationKit()) => (queueTask(() => play()), */}
            {/* {If($canvas, (o = initAnimation($canvas())) => */}
            {/* <> */}
            <span>{$elapsed}</span>
            <div>
               <button on:click={e => playPause()}>{($isPlaying() ? 'pause' : 'play')}</button>
               <input on:input={e => updateTime(e)} type="range" min="0" max="5000" value={$elapsed} />
            </div>
            {/* </> */}
            {/* )} */}
            <div>hi</div>
         </div>
      </>
   )
}


// function AnimationKit(canvas) {
//    const animation = ionize(new AnimationAnimator(inert(canvas)
//       // , {
//       //    ionize: {
//       //       elapsed: true,
//       //       isPlaying: true,
//       //       // canvas: 'inert'
//       //    }
//       // }
//    ))



//    return {
//       $elapsed: animation.$elapsed,
//       $isPlaying: animation.$isPlaying,
//       play() { animation.play() },
//       playPause,
//       updateTime
//    }
// }