import { template, If, Else, fade, ElseIf, NodeRef, createRoot, FromTag, ShowHideType, css } from "@rue/lumo";
import { Ion, ooo, queueRender, queueTask, toValue, watch } from "@rue/quarky";
import "./style.css"


export function TestIfElseRemountView(setup: FromTag<{ activation: [ShowHideType, ShowHideType] }>) {
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
            <remount-view>
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
            </remount-view>
         </div>
      </div>
   )
      .style(css`
         .container {
            overflow: hidden;
         }
      `)
}

if (__TEST__) createRoot(TestIfElseRemountView).mount('#root')