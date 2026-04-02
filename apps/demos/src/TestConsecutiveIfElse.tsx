import { template, If, Else, fade, ElseIf, NodeRef, createRoot, css } from "@rue/luent";
import { Ion, ooo, queueRender, queueTask, toValue, watch } from "@rue/quarky";
import "./style.css"


export function TestConsecutiveIfElse() {

   const $active = Ion(true, {
      toggle() {
         $active.value = !$active()
      }
   })

   const $ready = Ion(false, {
      toggle() {
         $ready.value = !$ready()
      }
   })

   return template(
      <div>
         <button id='toggle-active' on:click={e => { $active.toggle() }}>toggle active</button>
         <button id='toggle-ready' on:click={e => { $ready.toggle() }}>toggle ready</button>
         <hr></hr>
         <div class='container view'>
            {If($active,
               <div>
                  oh
                  <h2>hi</h2>
               </div>
            )}
            {Else(
               <div>
                  ok
                  <h2>bye</h2>
               </div>
            )}
            {If($ready,
               <div>
                  two peas in a pod
                  <h2>🤢🤢</h2>
               </div>
            )}
         </div>
      </div>
   )
      .style(css`
         .container {
            overflow: hidden;
         }
      `)
}


if (__TEST__) createRoot(TestConsecutiveIfElse).mount('#root')
