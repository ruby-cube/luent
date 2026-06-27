import { Else, If, NodeRef, css, component, Style } from "@rue/luent";
import { Ion, ion, queueTask, watch, Finitron, ionic } from "@rue/quarky";
import "./reset.css"


// FIX:
// [] additional optional chaining?
// [] if (!x) return; type guards

export function VideoPlayer() {

  const video = NodeRef("video")


  const player = Finitron({
    "loading": {
      markReady: () => "x:ready",
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

  const duration = () => video()?.duration ?? 0

  // player.on("initialize", () => {
  //    duration = video?.duration ?? 0
  // })

  const elapsedTime = ion(0);

  track.on("play", () => {

    //if (!video) return;
    if (track.is("ended")) elapsedTime = video().currentTime = 0;
    video.play()
  })

  track.on("pause", () => {
    video?.pause()
  })


  function updateTime(currentTime: number) {
    elapsedTime.value = currentTime;
  }

  function reClickElapsedBar(e: any) {
    console.log('### set Time')
    const rect = e.currentTarget!.getBoundingClientRect()
    setTime(rect.width, e.clientX - rect.left)
  }

  function setTime(width: number, x: number) {
    if (!video) return;
    const time = video.currentTime = video.duration * x / width
    if (track.is('playing')) {
      track.pause()
      queueTask(() =>
        track.play()
      )
    }
    elapsedTime.value = time
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

  watch(() => player.is('x:ready'), () => {
    console.log('@@@ ready!!')
  })



  return component(
    <>
      <div class="container">
        <video
          ref={video}
          on:canplay={e => player.markReady()}
          on:timeupdate={e => updateTime(e.currentTarget.currentTime)}
          on:ended={e => track.end()}
          on:error={e => player.error()}
        >
          <source src="https://developer.mozilla.org/shared-assets/videos/flower.mp4" type="video/mp4" />
        </video>

        {If((player.is("x:ready")), //FIX: conditionals break without a root node, conditionals are not being mounted correctly
          <div>
            <ElapsedBar
              elapsed={elapsedTime}
              duration={duration}
              paused={(track.is("paused"))}
              on:click={reClickElapsedBar}
            />
            <o:preserve>
              {If((track.is("playing")),
                <button on:click={e => track.pause()}>‖</button>
              )}
              {Else(
                <button on:click={e => track.play()}>►</button>
              )}
            </o:preserve>
            <Timer elapsed={elapsedTime} duration={duration} />
          </div>
        )}
      </div>
      {Style(css`
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
         `)}
    </>
  )

}


function ElapsedBar(input: {
  elapsed: Ion<number>,
  duration: number,
  paused: Ion<boolean>
}) {
  const { elapsed, duration, paused, emit } = input

  return component(
    <div class="elapsed"
      on:event={emit}
    >
      <div
        class="elapsed-bar"
        style={{
          width: (elapsed === 0 ? `0%` : paused ? `${percentage(duration, elapsed)}%` : `100%`),
          transition: (elapsed === 0 || paused ? undefined : `width ${duration - elapsed}s linear`)
        }}
      />
    </div>
  )
};



function Timer(input: {
  elapsed: Ion<number>,
  duration: number
}) {
  const { elapsed, duration } = input

  return component(
    <span class="timer">
      {(asTime(elapsed))} / {asTime(duration)}
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