import { template, If, Else, ElseIf, NodeRef, createRoot, FromTag, ShowHideType, css } from "@rue/lumo";
import { Ion, ooo, queueRender, queueTask, toValue, watch } from "@rue/quarky";
import "./style.css"


export function TestIfElseMix(setup: FromTag<{ activation: [ShowHideType, ShowHideType] }>) {
   const { activation } = setup
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
   )
      .style(css`
         .container {
            overflow: hidden;
         }
      `)
}


