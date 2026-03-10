import { template, Else, Finitron, FromTag, If, NodeRef, Style, css } from "@rue/lumo";
import { Ion, queueTask , destructureØ} from "@rue/quarky";
import "./reset.css"

export function VideoPlayer() {

   const ævideo = NodeRef("video")

   const player = Finitron({
      "loading": {
         init: () => "x:ready",
         error: () => "x:failed"
      },
      "x:ready": {},
      "x:failed": {}
   })

   const track = Finitron({
      "paused": {
         play: () => "playing"
      },
      "playing": {
         pause: () => "paused",
         end: () => "ended"
      },
      "ended": {
         play: () => "playing"
      }
   })

   const æduration = () => ævideo()?.duration ?? 0

   // player.on("init", () => {
   //    duration = $video()?.duration ?? 0
   // })

   track.on("play", () => {
      if (!ævideo()) return;
      if (track.is("ended")) æelapsedTime.value = ævideo()?.currentTime = 0;
      ævideo()?.play()
   })

   track.on("pause", () => {
      ævideo()?.pause()
   })

   const æelapsedTime = Ion(0);

   function updateTime(currentTime: number) {
      æelapsedTime.value = currentTime;
   }

   function reClickElapsedBar(e: { currentTarget: (EventTarget & HTMLDivElement) | null } & MouseEvent) {
      const rect = e.currentTarget!.getBoundingClientRect()
      setTime(rect.width, e.clientX - rect.left)
   }

   function setTime(width: number, x: number) {
      const time = ævideo()!.currentTime = ævideo()!.duration * x / width
      if (track.is('playing')) {
         track.pause() // FIX: clicking on elapsed bar breaks play/pause button
         queueTask(() => track.play())
      }
      æelapsedTime.value = time
   }

   const sound = Finitron({
      "unmuted": { toggle: () => "muted" },
      "muted": { toggle: () => "unmuted" }
   })

   player.init("loading", {
      "x:ready": () => {
         track.init("paused")
         sound.init("unmuted")
      }
   })


   return template(
      <div class="container">
         <ævideo()
            ref={ævideo}
            on:canplay={e => player.init()}
            on:timeupdate={e => updateTime(e.currentTarget.currentTime)}
            on:ended={e => track.end()}
            on:error={e => player.error()}
         >
            <source src="https://developer.mozilla.org/shared-assets/videos/flower.mp4" type="video/mp4" />
         </ævideo()>

         {If((player.is("x:ready")), //FIX: conditionals break without a root node, conditionals are not being mounted correctly
            <div>
               <ElapsedBar æelapsed()={æelapsedTime} æduration()={æduration()} æpaused()={(track.is("paused"))}
                  on:click={reClickElapsedBar}
               />
               {/* <remount-view> */}
               {If((track.is("playing")),
                  <button on:click={e => track.pause()}>‖</button>
               )}
               {Else(
                  <button on:click={e => track.play()}>►</button>
               )}
               {/* </remount-view> */}
               <Timer æelapsed()={æelapsedTime} æduration()={æduration()} />
            </div>
         )}
      </div>
   )
      .style(css`
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
      `)
}


function ElapsedBar(input: FromTag<{
   elapsed: Ion<number>,
   duration: number,
   paused: Ion<boolean>
   "on:click": MouseEvent
}>) {
const { æelapsed, duration, æpaused, emit } = destructureØ(input, 'æelapsed', 'duration', 'æpaused', 'emit');

   return template(
      <div class="elapsed"
         on:click={e => emit("click", e)}
      >
         <div
            class="elapsed-bar"
            style={{
               width: (æelapsed() === 0 ? `0%` : æpaused() ? `${percentage(duration, æelapsed())}%` : `100%`),
               transition: (æelapsed() === 0 || æpaused() ? undefined : `width ${duration - æelapsed()}s linear`)
            }}
         />
      </div>
   )
};



function Timer(input: FromTag<{
   elapsed: Ion<number>,
   duration: number
}>) {
const { æelapsed, duration } = destructureØ(input, 'æelapsed', 'duration');

   return template(
      <span class="timer">
         {(asTime(æelapsed()))} / {asTime(duration)}
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