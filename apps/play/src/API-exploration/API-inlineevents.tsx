//@ts-nocheck
import { template } from "@rue/lumo";

export function Comp() {
   return template(
      <>
         <input
            class="edit"
            type="text"
            mu:value={$(todo).title}
            at:mounted={node => node.focus()}
            on:blur={blur(e => doneEdit(todo))}
            on:keyup={keyup(e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo))}
         ></input>
      </>
   )
}