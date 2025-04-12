import { component, Else, fromTag, If, Ion, ref, v } from "@rue/lumo";
import { $effectCycle, finiton, getCurrentEffectCycle, ion, isIon, watch } from "@rue/quarky";
import { hasQuark } from "../../../packages/quarky/src/Quark";
import { isFunction } from "@rue/utils";
import { RENDER } from "../../../packages/lumo/src/render-cycle";

function markAnimationFrame(){
   requestAnimationFrame(()=>{
      console.log('@@@ ANIMATION FRAME-------')
      markAnimationFrame()
   })
}

export function VideoPlayer() {
   const $video = ref('video')
   // markAnimationFrame()

   const $videoPlayer = finiton('loading', {
      'loading': {
         init: () => 'x:ready',
         error: () => 'x:failure'
      },
      'x:ready': {},
      'x:failure': {}
   })

   const $track = finiton('paused', {
      'paused': {
         play: () => 'playing'
      },
      'playing': {
         pause: () => 'paused',
         end: () => 'ended'
      },
      'ended': {
         'on:enter': () => console.log('@% ...ended'),
         play: () => 'playing'
      }
   })

   let duration = 0

   $videoPlayer.on('init', () => { duration = $video()?.duration ?? 0 })

   console.log('@% isIon', isIon($videoPlayer))
   console.log('@% isFunction', isFunction($videoPlayer))
   console.log('@% name', $videoPlayer.name)

   $track.on('play', () => $video()?.play())
   $track.on('pause', () => $video()?.pause())
   $track.on('end', () => {
      $elapsedTime.state = $video()!.currentTime = 0;
      // setTimeout(()=>$track.apply('play'), 1);
      console.log('@% on end')
   })

   const $elapsedTime = ion(0);


   function updateTime(currentTime: number) {
      if (!$track.is('playing')) return;
      $elapsedTime.state = currentTime;
   }

   const $sound = finiton('on', {
      'on': { toggle: () => 'muted' },
      'muted': { toggle: () => 'on' }
   })

   $videoPlayer.nest({
      'x:ready': [$track, $sound]
   })

   $videoPlayer.activate()
   console.log('@% LOADING')

   watch(() => $track.is('playing'), ({ state, prevState }) => {
      console.log('@% track is playing changed', state, prevState)
      console.log('@% watch phase:', getCurrentEffectCycle()?.currentPhase)
   })

   watch($track, (e) => {
      console.log('@% $track changed', e, $track())
      console.log('@% watch phase:', getCurrentEffectCycle()?.currentPhase)
   })
   
   function endVideo() {
      console.log("@@@ EVENT: End video")
      console.log('@% end video phase:', getCurrentEffectCycle()?.currentPhase)
      if (getCurrentEffectCycle()?.currentPhase !== undefined) console.warn('@% existing effect cycle!')
      $track.apply('end')
   }

   function pauseVideo() {
      console.log("@@@ EVENT: click pause video")
      console.log('@% pause video phase:', getCurrentEffectCycle()?.currentPhase)
      if (getCurrentEffectCycle()?.currentPhase !== undefined) console.warn('@% existing effect cycle!')
      $track.apply('pause')
   }

   function playVideo() {
      console.log("@@@ EVENT: click play video")
      console.log('@% play video phase:', getCurrentEffectCycle()?.currentPhase)
      if (getCurrentEffectCycle()?.currentPhase !== undefined) console.warn('@% existing effect cycle!')
      $track.apply('play')
   }

   function initVideo() {
      console.log("@@@ EVENT: init video")
      console.log('@% init video phase:', getCurrentEffectCycle()?.currentPhase)
      if (getCurrentEffectCycle()?.currentPhase !== undefined) console.warn('@% existing effect cycle!')
      $videoPlayer.apply('init')
   }

   function updateTimeo() {
      console.log("@@@ EVENT: UPDATE TIME")
      console.log('@% time video phase:', getCurrentEffectCycle()?.currentPhase)
      if (getCurrentEffectCycle()?.currentPhase !== undefined) console.warn('@% existing effect cycle!')
      updateTime($video()!.currentTime)
   }

   return component(
      <>
         <video
            ref={$video}
            on:canplay={initVideo}
            on:timeupdate={updateTimeo}
            on:ended={endVideo}
            on:error={e => $videoPlayer.apply('error')}
         >
            <source src="/src/video-player-dance.mp4" type="video/mp4" />
         </video>
         <p>{$ = $track.is('playing')}</p>
         {If($ = $videoPlayer.is('x:ready'), (console.log('@% refresh'),
            <>
               <ElapsedBar elapsed={$elapsedTime} duration={duration} />
               <Timer elapsed={$elapsedTime} duration={duration} />
               {If($=$track.is('playing'),
               <button on:click={pauseVideo}>Pause</button>
               )}
               {Else(
               <button
                  on:click={playVideo}
               >Play</button>
               )}
            </>
         ))}
         <$--style>{`
         html {
  font-size: 18px;
}

video {
  max-width: 100%;
  margin-bottom: -3px;
}

button {
  background: #a8dba8;
  padding: 0.25rem 0.5rem;
  border: none;
  cursor: pointer;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.elapsed {
  width: 100%;
  height: 5px;
}
.elapsed-bar {
  transition: width 0.5 ease;
  height: 5px;
  background-color: #629460;
}

.timer {
  display: inline-block;
  margin-left: 5px;
}
         `}</$--style>
      </>
   )
}

function ElapsedBar(input = fromTag({
   elapsed: Ion<number>,
   duration: v<number>
})) {
   const { $elapsed, duration } = input
   return component(
      <div class="elapsed">
         <div
            class="elapsed-bar"
            style={{ width: `${percentage(duration, $elapsed())}%` }}
         />
      </div>
   )
};

function Timer(input = fromTag({
   elapsed: Ion<number>,
   duration: v<number>
})) {
   const { $elapsed, duration } = input
   return component(
      <span class="timer">
         {minutes($elapsed())}:{seconds($elapsed())} of {minutes(duration)}:
         {seconds(duration)}
      </span>
   )
};


const percentage = (duration, elapsed) => {
   if (duration <= 0) {
      return 0;
   }
   return (elapsed / duration) * 100;
};

const minutes = seconds => Math.floor(seconds / 60);

const seconds = seconds =>
   Math.floor(seconds % 60).toLocaleString("en-US", {
      minimumIntegerDigits: 2,
      useGrouping: false
   });