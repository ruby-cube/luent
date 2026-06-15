import { component, NodeRef } from "@rue/luent";
import {  ion, ionic } from "@rue/quarky";

// Source of AnimationAnimator class: https://svelte.dev/playground/a7b1bf2fb4d947eda4f72ebabd8b06e6?version=5.19.0#H4sIAAAAAAAAE7VYbY_buBH-K3O6ApYvXtmbXg6t19oi2eSAAA1wyOaAAFU_0NJ4lw1F6cjRrl3D_70gKUukLPu2Re_DrmXOyzOcd3kfSVZitIzeSl4y4pWEu0qSqoRAFc2iDReoo-U_9hHtasNnDqJZJ1XXiX5CQeZszTSOneeVJJSko2W00rniNd1mMqP5HL48cg15VaKGjapKYBJwS6gkEyD4WjG1SwwrL-tKEXxGlhN_ws7W3lQnn0XJ_AJTa1LyL51FN57ePVTyU9VIgsNRj-Ns2cyfQIKcySemIYU_aWKE8fSmo_SGjFBrwXbvGqJKdkfES7znBaoAAAWrNRa9jkWvhOtfBNtx-dBTSTU47RS0d4jjKaS3sLfHFBgm8fmSD2N3v1ajJ5qwovjwhJL-zjWhRBVnUVMXzDhoBjH6gBn1l8CkQGJcJO1Rq_jwMgTjtV9Yo0dBfG90MN3hBSCjtQ2NI8uMNo3Mbep3kPH0CMU3EHviHcS0t8Uja6rq-Ih6ABQaR_k8KzI6WGMGpjj_fuElmqv30dQudz6ZNKyZ0vhRUowJMfWAlDwx0aWEj_dQfamsLifb3j-Tq3lfkHJV8CfQtBOYZlHBtTFyCRuB2xv7_6rgCq11S8gr0ZTyBpjgD_KKE5basV5pYoqyyJb4qq2YNZfFkh65Tvfu5NDhrCtVoFrCdb0FXQlewFqw_FsWwTMv6DHNop8WiyyCR-QPj5Rm0Wvz9XY1d4oczHdXV_ARnpkkMChQMGJAFawRVJvvcHXleHXN5O2-zcjDam6_W0rBn26d51ZrW61QyVzw_Fu67xLjcLvvU-9vMKnN4QSWMDEsk8Nq7kSPirisG4JK2s9030f1AKahplmkmHzALIKSyzSLzFVLtk2z6M3C3ttGNO3sdZbOnanuM5pFhFuKlqYdHGZnOvWL2mLYxF8q4vX3tqFebNBj6o4dWeLWKihwwxpBkAumtZ0JstCjam1loGkdX2wJtG3uQ38SH8v8pMeYe84gZ0KsWf6tqzKTQomn8rQ5DQRvvAJWWFZP-L_hvEDWhzIlyih_tAIto-uEg4ZhMVrH3DWaqtIX2bdC0LXLE8NCJEsJLVHsOc4bpVDS1w5cNzWqJKT5CKFWf6Tsj5NwCc6WdqQcAlTXREO0oLGOogRjZd-P1SWY-hlAuH4eQgQ9_r-E2DAzEXqMw8uKd7xkBivXOR6vPEerqxN0D5UKkkc1OVXdatAPM3vxbiFyDzchkbYdJXlAMnbhluLJ62IyDVn1bw1TeM__jZDCm8WAaAbKV0hhcI6y-NoD2GkBVzDQF4rsIIX2KokbKKcSU5jD61CMHT30vlFuRzZWLsbsNK3dVFojxBkdPyt2hqVfnAaa7ZA5q9lfhWx-eWuFfRivTruA3wlkqnXhMHhJboifMad4MYPFDLyQO3eHR86hfWQ9mPeKPYNz8QnKhgtxb5YBSGHy_Z9__OtfivXkJJMsm7XleJEWfDcbBvDkYDp0iIsFHlUZz3puMRvfd2FEPepIsD01x3QKF14P2nmdibwRjBBqVT0o1BrihdlXrqdnEmIEorOgA3HNvlOZwidGj0nJZRxom8N4Us_gejR4vbWtFVBXmhuJEPgYGEjBr9tXEPfl6tv-dQo_dNaezZoj5saUTeCd0cESKPjVDhTQwrxoAd8AJ8At16RDy-3LmGNKoajypkRJpmV9EGge3-0-FvGk5_Lal0mWnhDmSXfs1vKjX4a54Vvx3m3dv2dGy-bZ0VvS0gJTnDEtJTFd-M4NBdMPB8lxvVgspglVP_MtFvH1FF7BRE88oIOf1CfJUkniskHo0sv4XVbmFbmsBRL6nutydQXXpzV20jIV_tagprfBeezxYmLeNOzJtPfN8D2sK2Fvjnv1072sX4pCz3UShJ40iEFPGIRgYhr4JRd37SNcedrylDkKYHLnctsMgs5zQZqe-jQwMLeKzju3E7q5lACfUSOBLXCb0bBuCErGJTEuux84DOVlw9NTfW-Vntzt_5orJxPV7GXD-RFuhX-Ud1-0OBzOGj66Cgx_Bwgy6Z6q2uaRaqQcTaPRuvG3CVbWLupUeR2gaCfMYF4YbizaoLtZxbZm1-jnlrVydmZgTS81_bOZ5g3V3oDLc69rU0wWZ4afN3VfNGwHQ_uPmZ12ZgIj0DXmfMPH3DE6RU_fTP45i8w74jOXRbS0qXX4D6KGjjI7FgAA
// linked from https://github.com/sveltejs/svelte/issues/15068

class AnimationAnimator {
   canvas: HTMLCanvasElement;
   ctx: CanvasRenderingContext2D | null;
   squareSize: number;
   startX: number;
   endX: number;
   y: number;
   animationDuration: number;
   startTime: null | number;
   animationFrame: null | number;
   elapsed: number;
   pauseTime: null | number;
   isPlaying: boolean;

   constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
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

   draw(currentX: number) {
      // Clear canvas
      this.ctx!.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw square
      this.ctx!.fillStyle = '#3498db';
      this.ctx!.fillRect(currentX, this.y, this.squareSize, this.squareSize);
   }

   animate(currentTime: number) {
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

   goToTime(timeMs: number) {
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

   const $canvas = NodeRef('canvas')

   // const $animation = ion(() =>$canvas() ? ionic(new AnimationAnimator(inert($canvas()))) : undefined)

   const $elapsed = ion(() =>$animation()?.$elapsed() ?? 0)
   const $isPlaying = ion(() =>$animation()?.$isPlaying() ?? false)
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
      const animation = $animation.value = ionic(new AnimationAnimator(canvas.ref))

      // debug.traceTriggers('# animation', animation, { canvas: true })

      // const list = ionic([])

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
            <canvas ref={$canvas} at:attach={initAnimation} style="border: 1px solid black" width="600" height="200"></canvas>
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
//    const animation = ionic(new AnimationAnimator(inert(canvas)
//       // , {
//       //    ionic: {
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