import { mountTextNode } from "./TextNode";
import { NodeKit } from "./setUpNodeEntities";
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
   nodeEntities: NodeKit[],
   parent: Element, //TODO: parent is as optional as fragment I think...
   fragment?: DocumentFragment,
) {
   for (const nodeEntity of nodeEntities) {
      mountNodeEntity(nodeEntity, parent, fragment)
   }
}


function mountNodeEntity(
   nodeEntity: NodeKit,
   parent: Element, //TODO: parent is as optional as fragment I think...?
   fragment?: DocumentFragment,
) {
   if (nodeEntity instanceof Element) { // Element type from Web API
      const root = fragment ? fragment : parent;
      root.appendChild(nodeEntity)
   }
   else if (nodeEntity instanceof CharacterData){
      mountTextNode(nodeEntity, parent, fragment)
   }
   else if (isInnerHTMLKit(nodeEntity)) {
      mountInnerHTML(nodeEntity, parent)
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