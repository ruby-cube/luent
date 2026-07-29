import { If, mountIsland, Style, css } from "luent";
import { Ion, ion } from "@luent/quarky";
import "./style.css"


export function TestIfElseDisplayView(setup: {}) {
  const $active = ion(true, {
    toggle() {
      $active.value = !$active()
    }
  })

  const $ready = ion(false, {
    toggle() {
      $ready.value = !$ready()
    }
  })

  const series = IfSeries(
    ['if', $active],
    ['else if', $ready]
  )

  return (
    <>
      <div>
        <button id='toggle-active' on:click={() => { $active.toggle() }}>toggle active</button>
        <button id='toggle-ready' on:click={() => { $ready.toggle() }}>toggle ready</button>
        <hr></hr>
        <div class='container view'>
          <div display-if={series($active)} id='active'>
            oh
            <h2>hi</h2>
            {If($ready,
              <p>ready</p>
            )}
          </div>
          <div display-if={series($ready)} id='ready'>
            two peas in a pod
            <h2>🤢🤢</h2>
          </div>
          <div display-if={series.otherwise} id='neither'>
            ok
            <h2>bye</h2>
          </div>
        </div>
      </div>
      {Style(css`
         .container {
            overflow: hidden;
         }
      `)}
    </>
  )
}

function IfSeries(...args: ['if' | 'else if', Ion<any>][]) {
  function series($condition: Ion<any>) {
    return () => {
      for (const [_, _$condition] of args) {
        if (_$condition === $condition && $condition()) return true;
        if (_$condition()) return false;
      }
      return false;
    }
  }
  series.otherwise = () => {
    for (const [_, $condition] of args) {
      if ($condition()) return false;
    }
    return true;
  }
  return series
}


if (__TEST__) mountIsland(TestIfElseDisplayView, '#root')