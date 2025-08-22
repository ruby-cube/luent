import { component, Else, FromTag, If, NodeRef, Style } from "@rue/lumo";
import { FiniteIon, Ion, ion } from "@rue/quarky";
import './reset.css'


export function VideoPlayer() {

   const $video = NodeRef('video')

   const $player = FiniteIon({
      'loading': {
         init: () => 'x:ready',
         error: () => 'x:failure'
      },
      'x:ready': {},
      'x:failure': {}
   })

   const $track = FiniteIon({
      'paused': {
         play: () => 'playing'
      },
      'playing': {
         pause: () => 'paused',
         end: () => 'ended'
      },
      'ended': {
         play: () => 'playing'
      }
   })

   let duration = 0

   $player.on('init', () => { duration = $video()?.duration ?? 0 })

   $track.on('play', () => {
      const video = $video()
      if (!video) return;
      if ($track.is('ended')) $elapsedTime.state = video.currentTime = 0;
      $video()?.play()
   })
   $track.on('pause', () => $video()?.pause())
   // $track.on('end', () => {
   //    const video = $video()
   //    if (!video) return;
   //    $elapsedTime.state = video.currentTime = 0;
   // })

   const $elapsedTime = ion(0);

   function updateTime(currentTime: number) {
      if (!$track.is('playing')) return;
      $elapsedTime.state = currentTime;
   }

   const $sound = FiniteIon({
      'on': { toggle: () => 'muted' },
      'muted': { toggle: () => 'on' }
   })

   $player.activate(() => 'loading')
      .nest({
         'x:ready': [
            $track.init(() => 'paused'),
            $sound.init(() => 'on')
         ]
      })

   return component(
      <>
         <div class='container'>
            <video
               ref={$video}
               on:canplay={e => $player.apply('init')}
               on:timeupdate={e => updateTime(e.currentTarget.currentTime)}
               on:ended={e => $track.apply('end')}
               on:error={e => $player.apply('error')}
            >
               <source src="/src/video-player-dance.mp4" type="video/mp4" />
            </video>
            {If(($player.is('x:ready')),
               <>
                  <ElapsedBar elapsed={$elapsedTime} duration={duration} paused={($track.is('paused'))} />
                  {/* <button on:click={e => $track.apply($track.is('playing') ? 'pause' : 'play')}>
                     {If(($track.is('playing')),
                        '‖'
                     )}
                     {Else(
                        '►'
                     )}
                  </button> */}
                  {/* <o-show> */}
                     {If(($track.is('playing')),
                        <button on:click={e => $track.apply('pause')}>‖</button>
                     )}
                     {Else(
                        <button on:click={e => $track.apply('play')}>►</button>
                     )}
                  {/* </o-show> */}
                  <Timer elapsed={$elapsedTime} duration={duration} />
               </>
            )}
         </div>

         {Style`
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
              width: 2rem;
              border-radius: 5px;
            }

            .container {
              max-width: 480px;
              margin: 0 auto;
            }

            .elapsed {
              width: 100%;
              height: 5px;
            }

            .elapsed-bar {
              height: 5px;
              background-color: #629460;
            }

            .timer {
              display: inline-block;
              margin-left: 5px;
            }
         `}
      </>
   )
}


function ElapsedBar(input: FromTag<{
   elapsed: Ion<number>,
   duration: number,
   paused: Ion<boolean>
}>) {
   const { $elapsed, duration, $paused } = input

   return component(
      <div class="elapsed">
         <div
            class="elapsed-bar"
            style={{
               width: (`${percentage(duration, $elapsed())}%`),
               transition: ($elapsed() === 0 || $paused() ? undefined : 'width .5s ease')
            }}
         />
      </div>
   )
};

function Timer(input: FromTag<{
   elapsed: Ion<number>,
   duration: number
}>) {
   const { $elapsed, duration } = input

   return component(
      <span class="timer">
         {(asTime($elapsed()))} / {asTime(duration)}
      </span>
   )
};

function asTime(elapsed: number) {
   return `${minutes(elapsed)}:${seconds(elapsed)}`
}

const percentage = (duration: number, elapsed: number) => {
   if (duration <= 0) {
      return 0;
   }
   return (elapsed / duration) * 100;
};

const minutes = (seconds: number) => Math.floor(seconds / 60);

const seconds = (seconds: number) =>
   Math.floor(seconds % 60).toLocaleString("en-US", {
      minimumIntegerDigits: 2,
      useGrouping: false
   });