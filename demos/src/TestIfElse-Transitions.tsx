import { component, template, If, Else, ElseIf, NodeRef, mountIsland, Style, css } from "luent";
import { ion } from "@luent/quarky";
import "./style.css"
// import { Transition } from "../../../packages/luent/src/transitions/Transition";


export function TestIfElse() {

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

  return (
    <>
      <div style='position: relative'>
        <button id='toggle-active' on:click={() => { $active.toggle() }}>toggle active</button>
        <button id='toggle-ready' on:click={() => { $ready.toggle() }}>toggle ready</button>
        <hr></hr>
        <div class='container view'>
          <o:transition in out>
            {If($active,
              <div>
                oh
                <h2>hi</h2>
                {If($ready,
                  <p in-out>ready</p>
                )}
              </div>
            )}
            {ElseIf($ready,
              <div>
                two peas in a pod
                <h2>🤢🤢</h2>
              </div>
            )}
            {Else(
              <div>
                ok
                <h2>bye</h2>
              </div>
            )}
          </o:transition>
        </div>
      </div>
      {Style(css`
        .container {
          overflow: hidden;
        }

        // @keyframes fade-in {
        //   from { opacity: 0 }
        //   to { opacity: 1 }
        // }
       
        // .fade-in {
        //   animation: 2500ms ease-in both fade-in
        // }
       
        // .fade-out {
        //   animation: 2500ms ease-in reverse both fade-in
        // }

        // .opacity-0 {
        //   opacity: 0;
        // }

        // .fade {
        //   transition: opacity 2500ms ease-in;
        // }
        
      `)}
    </>
  )
}


if (__TEST__) mountIsland(TestIfElse, '#root')
