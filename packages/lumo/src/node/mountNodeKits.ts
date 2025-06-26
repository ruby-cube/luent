import { NodeEntity } from "./setUpNodeEntities";
import { debug } from "@rue/utils";
import { isInnerHTMLKit, mountInnerHTML } from "./InnerHTML";

// node kits:
// - text ion
// - element
// - array (for conditional series)



// node entity:
// - textNode
// - element
// - 

export function mountNodeEntities(
   nodeEntities: NodeEntity[],
   parent: Element,
   fragment? : DocumentFragment
) {
   for (const nodeEntity of nodeEntities) {
      mountNodeEntity(nodeEntity, parent, fragment)
   }
}


function mountNodeEntity(
   nodeEntity: NodeEntity,
   parent: Element,
   fragment?: DocumentFragment
) {
   if (nodeEntity instanceof Element || nodeEntity instanceof CharacterData) { // Element type from Web API
       const root = fragment ? fragment : parent;
      root.appendChild(nodeEntity)
   }
   else if (isInnerHTMLKit(nodeEntity)) {
      if (parent instanceof DocumentFragment) {
         if (__DEV__) console.error('Cannot append innerHTML to document fragment')
         return;
      }
      mountInnerHTML(nodeEntity.innerHTML, parent)
   }
   else if ('mount' in nodeEntity) {
      nodeEntity.mount(parent, fragment)
   }
   else {
      debug.error('[[INVALID INPUT]] Invalid node entity')
   }
}



// creating conditional series
// 