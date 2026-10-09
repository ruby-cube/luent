import { component, template, If, Else, ElseIf, NodeRef, mountIsland, ViewType, Style, css } from "luent";
import { ion, ooo, awaitRender, queueTask, toValue, observe } from "@luently/quarky";
import "./style.css"


export function TestIfElseMix(setup: { activation: [ViewType, ViewType] }) {
   const { activation } = setup
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
      <div>
         <button id='toggle-active' on:click={e => { $active.toggle() }}>toggle active</button>
         <button id='toggle-ready' on:click={e => { $ready.toggle() }}>toggle ready</button>
         <hr></hr>
         <div class='container view'>
            {If($active, activation[0],
               <div>
                  oh
                  <h2>hi</h2>
                  {If($ready,
                     <p>ready</p>
                  )}
               </div>
            )}
            {ElseIf($ready, activation[1],
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


