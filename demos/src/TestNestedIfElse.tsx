import { component, template, If, Else, ElseIf, NodeRef, createRoot, Style, css } from "@rue/luent";
import { ion, ooo, queueRender, queueTask, toValue, watch } from "@rue/quarky";
import "./style.css"


export function TestNestedIfElse() {

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
            {If($active, If($ready,
               <p>ready</p>
            ))}
            {Else(
               <div>
                  not ready
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


if (__TEST__) createRoot(TestNestedIfElse).mount('#root')
