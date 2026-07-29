import { component, template, If, Else, ElseIf, NodeRef, mountIsland, ViewType, Style, css } from "luent";
import { Ion, ion, atRender, queueTask, toValue, watch } from "@luent/quarky";
import "./style.css"


export function TestIfElseRemountView() {
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
            <o:preserve>
               {If($active,
                  <div>
                     oh
                     <h2>hi</h2>
                     {If($ready,
                        <p>ready</p>
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
            </o:preserve>
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

if (__TEST__) mountIsland(TestIfElseRemountView, '#root')