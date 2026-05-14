//@ts-nocheck
import { Component, template } from "@rue/luent";

export function Comp() {
   return Component(
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