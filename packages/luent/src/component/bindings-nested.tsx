import { AnyObject } from "@rue/types"
import { ComponentKit, FromTag, RawJSXNode } from ".."



export type NestedAttributeSetup = {
   [key: string]: NestedSetup<any>
}
type NestedSetup<T> = (nested: { [key: string]: (setup: FromTag<T>) => ComponentKit }) => RawJSXNode

// TODO:
export function nestAttributes(fragment: DocumentFragment, setup: NestedAttributeSetup) {
   const keys = Object.keys(setup)
   for (const key of keys) {
      const bind = setup[key]
      const node = fragment.querySelector(key);
      bind(new Proxy({}, {
         get(target, key) {
            return (setup: AnyObject) => {
               // TODO: need to provide as auto-bind somehow
               return ({ as: undefined, nodes: [node] })
            }
         }
      }))
   }
}


// example

// function App() {
//    <Board
//       nested-bind={{ 
//          '.open': n => <n.button on:click={() => console.log('clicked')} /> 
//       }}
//    ></Board>
// }




// function Board(setup: FromTag<{
//    'nested-bind': {
//       '.open': NestedSetup<'button'>
//    }
// }>) {
//    return Component(
//       <div>
//          <button class='open'></button>
//       </div>
//    )
// }