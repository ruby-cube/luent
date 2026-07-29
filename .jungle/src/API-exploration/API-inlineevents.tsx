//@ts-nocheck
import { component, template } from "luent";

export function Comp() {
   return (

      <>
         <input
            class="edit"
            type="text"
            mu:value={$(todo).title}
            at:attach={node => node.focus()}
            on:blur={blur(e => doneEdit(todo))}
            on:keyup={keyup(e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo))}
         ></input>
      </>
   )
}