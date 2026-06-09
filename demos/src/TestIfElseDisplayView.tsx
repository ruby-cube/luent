import { component, template, If, Else, ElseIf, NodeRef, createRoot, FromTag, ShowHideType, Style, css } from "@rue/luent";
import { ion, ooo, atRender, queueTask, toValue, watch } from "@rue/quarky";
import "./style.css"


export function TestIfElseRemountView(setup: FromTag<{}>) {
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

   return component(
      <>
      <div>
         <button id='toggle-active' on:click={e => { $active.toggle() }}>toggle active</button>
         <button id='toggle-ready' on:click={e => { $ready.toggle() }}>toggle ready</button>
         <hr></hr>
         <div class='container view'>
            <show-view>
               {If($active,
                  <div id='active'>
                     oh
                     <h2>hi</h2>
                     {If($ready,
                        <p>ready</p>
                     )}
                  </div>
               )}
               {ElseIf($ready,
                  <div id='ready'>
                     two peas in a pod
                     <h2>🤢🤢</h2>
                  </div>
               )}
               {Else(
                  <div id='neither'>
                     ok
                     <h2>bye</h2>
                  </div>
               )}
            </show-view>
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

if (__TEST__) createRoot(TestIfElseRemountView).mount('#root')