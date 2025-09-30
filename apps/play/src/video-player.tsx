import { component, Else, EventHandler, FromTag, If, NodeRef, Style } from "@rue/lumo";
import { FiniteState, Ion, ion, ionize } from "@rue/quarky";
import "./reset.css"

const $count = ion(0)

const obj = {
   $count,
   frog: ion(0)
}

const _$frog = ion(0)

const obj2 = {
   get frog() {
      return _$frog()
   },
   set frog(v) {
      _$frog.value = v
   }
}

export function VideoPlayer() {

   const $video = NodeRef("video")

   const player = FiniteState({
      "isLoading": {
         init: () => "x:isReady",
         error: () => "x:hasFailed"
      },
      "x:isReady": {},
      "x:hasFailed": {}
   })

   const track = FiniteState({
      "isPaused": {
         play: () => "isPlaying"
      },
      "isPlaying": {
         pause: () => "isPaused",
         end: () => "hasEnded"
      },
      "hasEnded": {
         play: () => "isPlaying"
      }
   })

   let duration = 0

   player.on("init", () => {
      duration = $video()?.duration ?? 0
   })

   track.on("play", () => {
      const video = $video()
      if (!video) return;
      if (track.is("ended")) $elapsedTime.value = video.currentTime = 0;
      $video()?.play()
   })

   track.on("pause", () => {
      $video()?.pause()
   })

   const $elapsedTime = ion(0);

   function updateTime(currentTime: number) {
      $elapsedTime.value = currentTime;
   }

   function reClickElapsedBar(e: { currentTarget: (EventTarget & HTMLDivElement) | null } & MouseEvent) {
      const rect = e.currentTarget!.getBoundingClientRect()
      setTime(rect.width, e.clientX - rect.left)
   }

   function setTime(width: number, x: number) {
      const video = $video()!
      const time = video.currentTime = video.duration * x / width
      if (track.is('playing')) {
         track.apply("pause")
         setTimeout(() => track.apply("play"), 0)
      }
      $elapsedTime.value = time
   }

   const sound = FiniteState({
      "isOn": { toggle: () => "isMuted" },
      "isMuted": { toggle: () => "isOn" }
   })

   player.activate(() => "isLoading")
      .nest({
         "x:isReady": [
            track.init(() => "isPaused"),
            sound.init(() => "isOn")
         ]
      })

   const videoPlayer = ionize({
      player
   })
   // {
   //    init() {
   //       player.apply('init')
   //    },
   //    end() {
   //       track.apply('end')
   //    },
   //    play() {
   //       track.apply('play')
   //    },
   //    pause() {
   //       track.apply('pause')
   //    },
   //    errorOut() {
   //       player.apply('error')
   //    },
   //    isReady() {
   //       player.is('x:ready')
   //    },
   //    isPaused() {
   //       track.is('paused')
   //    },
   //    isPlaying() {
   //       track.is('playing')
   //    },
   // }

   return component(
      <>
         <div class="container">
            <video
               ref={$video}
               on:canplay={e => player.apply("init")}
               on:timeupdate={e => updateTime(e.currentTarget.currentTime)}
               on:ended={e => track.apply("end")}
               on:error={e => player.apply("error")}
            >
               <source src="/src/video-player-dance.mp4" type="video/mp4" />
            </video>

            {If((player.is("x:ready")), //FIX: conditionals break without a root node, conditionals are not being mounted correctly
               <div>
                  <ElapsedBar elapsed={$elapsedTime} duration={duration} paused={(track.is("paused"))}
                     on:click={reClickElapsedBar}
                  />
                  <mount-remount>
                     {If((track.is("playing")),
                        <button on:click={e => track.apply("pause")}>‖</button>
                     )}
                     {Else(
                        <button on:click={e => track.apply("play")}>►</button>
                     )}
                  </mount-remount>
                  <Timer elapsed={$elapsedTime} duration={duration} />
               </div>
            )}
         </div>

         {Style`
            html {
              font-size: 18px;
              background-color: black;
              color: white;
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
              height: 10px;
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
   "on:click": MouseEvent
}>) {
   const { $elapsed, duration, $paused, emit } = input

   return component(
      <div class="elapsed"
         on:click={e => (console.log("click", emit("click", e)))}
      >
         <div
            class="elapsed-bar"
            style={{
               width: ($elapsed() === 0 ? `0%` : $paused() ? `${percentage(duration, $elapsed())}%` : `100%`),
               transition: ($elapsed() === 0 || $paused() ? undefined : `width ${duration - $elapsed()}s linear`)
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