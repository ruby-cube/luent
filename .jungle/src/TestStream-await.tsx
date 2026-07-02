//@ts-nocheck
import { component, template, Stream } from "@rue/luent"
import { Ion, ion } from "@rue/quarky"
import { AnyObject } from "@rue/types";
import './TestStreamIon.css'

function encase<T>(fn: () => T) {
  return fn()
}


export function TestVanillaStream() {

  const $eye = ion(1, {
    bug() { this.value = 2 },
    reset() { this.value = 1 },
    toggle() { this.value = this.value === 1 ? 2 : 1 }
  });

  // const bugeye = Stream(async ({ interval, span }) => {
  //    await span(() => $eye.bug())
  //    await interval(500, () => $eye.toggle(), { max: 5 })
  //    await span(() => $eye.reset())
  // }, { '@stop': () => $eye.reset() })

  const bugeyeB = Stream(ooo => {
    ooo.do(() => $eye.bug())
      .interval(500, () => $eye.toggle(),
        { max: 5 })
      .do(() => $eye.reset())
  }, { '@stop': () => $eye.reset() })

  const $eye = Stream(ooo => {
    ooo.do(x => 2)
      .interval(500, x => x === 1 ? 2 : 1,
        { max: 5 })
      .do(x => 1)
  }, { '@stop': x => 1 })

  const $side = ion('l' as 'l' | 'r')

  const turning = Stream(ooo => {
    ooo.do(() => $side.value = 'r')
      .interval(1000, () => $side.value = $side.value === 'l' ? 'r' : 'l',
        { max: 3 })
      .do(() => $side.value = 'l')
  }, { '@stop': () => $side.value = 'l' })

  const $side = Stream(ooo => {
    ooo.do(x => 'r')
      .interval(1000, x => x === 'l' ? 'r' : 'l',
        { max: 3 })
      .do(x => 'l')
  }, { '@stop': x => 'l' })


  const $running = ion(false as false | 3 | 4)

  const running = Stream(ooo => {
    ooo.do(() => $running.value = 3)
      .interval(125, () => $running.value = $running.value === 3 ? 4 : 3,
        { max: 32 })
      .do(() => $running.value = false)
  }, { '@stop': () => $running.value = false })


  // const animation = Stream(async ({ span, repeat }) => {
  //    await repeat(3, async () => {
  //       await span(turning, running)
  //       await span(bugeye)
  //    })
  // })

  const animationB = Stream(oo => {
    oo.repeat(3, oo => {
      oo.stream(turning, running)
        .stream(bugeye)
    })
  })

  const animationB = Stream(oo => { // new AsyncSequence()
    oo.repeat(3, oo => {
      oo.await([turning, running]) // await() returns .then and .catch and can take in a then fn as last argument, span() does not
        .await(bugeye)
    })
  })

  const $frame = ion(() =>
    $running() ? $running() : $eye()
  )

  return (

    <>
      <div class="logo">
        <div class={['bg dragon', (`${$side()}${$frame()}`)]}></div>
      </div>
      <button on:click={e => { animation.start() }}>start</button>
      <button on:click={e => { animation.stop() }}>stop</button>
    </>
  )
}

