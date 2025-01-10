import { DOMNode } from "../component/InternalComponent";

// type AnyVineNode = VineNode | NodeVine | NodePod

export class VineNode implements IVineNode {
   active = true;
   prev: IVineNode | undefined;
   // next: IVineNode | undefined;
   constructor(
      public node: DOMNode | undefined,
   ) { }

   deactivate(preserveNode?: boolean) {
      this.node?.remove()
      if (!preserveNode) this.node = undefined;
      this.active = false;
   }

   activate(node?: DOMNode) {
      if (node) this.node = node
      this.active = true;
   }
}


type IVineNode = {
   next: IVineNode | undefined;
   prev: IVineNode | undefined;

   active: boolean;
   deactivate: Function;
   activate: Function;
}

type INodeVine = {
   head: IVineNode | undefined;
   tail: IVineNode | undefined;
   headNode: DOMNode | undefined;
   tailNode: DOMNode | undefined;
   prevNode: DOMNode | undefined
   push: Function
   forActive: Function
   clear: Function
}



export const PRESERVE_NODE = true;


function detach(node: IVineNode | undefined, key: 'prev' | 'next') {
   if (node)
      node[key] = undefined
}

function bestow(vine: NodeVine, key: 'prev' | 'next', newNode: IVineNode | undefined) {
   if (newNode && vine[key]) {
      newNode[key] = vine[key] // node inherts `prev` if NodeVine is a nested VineNode
   }
}

function setHead(vine: NodeVine, newHead: IVineNode | undefined) {
   const old = vine._head;
   if (newHead === old) return;
   vine._head = newHead;
   detach(old, 'prev')
   bestow(vine, 'prev', newHead)
}

function setTail(vine: NodeVine, newTail: IVineNode | undefined) {
   const old = vine._tail;
   if (newTail === old) return;
   vine._tail = newTail;
   detach(old, 'next')
   bestow(vine, 'next', newTail)
}

export class NodeVine implements IVineNode, INodeVine {
   active = true;
   _head: IVineNode | undefined;
   _tail: IVineNode | undefined;

   get head(): IVineNode | undefined {
      return this._head;
   }

   set head(newHead: IVineNode | undefined) {
      setHead(this, newHead)
   }

   get tail(): IVineNode | undefined {
      return this._tail;
   }

   set tail(newTail: IVineNode | undefined) {
      setTail(this, newTail)
   }

   get headNode(): DOMNode | undefined {
      if (this.head instanceof NodeVine && this.head.active) {
         return this.head.headNode;
      }
      if (this.head instanceof VineNode && this.head.active) {
         return this.head.node
      }
   }

   get tailNode(): DOMNode | undefined {
      if (this.tail instanceof NodeVine && this.tail.active) {
         return this.tail.tailNode;
      }
      if (this.tail instanceof VineNode && this.tail.active) {
         return this.tail.node
      }
   }

   private _prev: IVineNode | undefined;
   get prev() {
      return this._prev;
   }
   set prev(node: IVineNode | undefined) {
      this._prev = node;
      if (this.head)
         this.head.prev = node;
   }
   private _next: IVineNode | undefined;
   get next() {
      return this._next;
   }
   set next(node: IVineNode | undefined) {
      this._next = node;
      if (this.tail)
         this.tail.next = node;
   }

   get prevNode(): DOMNode | undefined {
      let prevNode = this.prev;
      while (prevNode) {
         if (prevNode.active) {
            return prevNode.node
         }
         prevNode = prevNode.prev;
      }
      return prevNode
   }

   push(node: IVineNode) {
      const tail = this.tail;
      this.tail = node;
      if (!this.head) {
         this.head = node;
      }
      else if (tail) {
         tail.next = node;
         node.prev = tail;
      }
   }

   clear() {
      this.head = undefined;
      this.tail = undefined;
   }

   insert() {

   }

   remove() {

   }

   deactivate(preserveNodes?: boolean) {
      this.forEach((node) => {
         node.deactivate(preserveNodes)
      })
      this.active = false;
   }

   activate(node?: DOMNode) {
      if (node) this.node = node
      this.active = true;
   }

   forActive(task: (node: IVineNode) => void) {
      let current: IVineNode | undefined = this.head
      while (current) {
         if (current.active) {
            task(current)
         }
         if (current === this.tail)
            return;
         current = current.next
      }
   }
}



// export class NodePod extends Array implements IVineNode, INodeVine {
//    head: IVineNode | undefined;
//    tail: IVineNode | undefined;

//    get headNode(): DOMNode | undefined {
//       if (this.head instanceof NodeVine && this.head.active) {
//          return this.head.headNode;
//       }
//       if (this.head instanceof VineNode && this.head.active) {
//          return this.head.node
//       }
//    }

//    get tailNode(): DOMNode | undefined {
//       if (this.tail instanceof NodeVine && this.tail.active) {
//          return this.tail.tailNode;
//       }
//       if (this.tail instanceof VineNode && this.tail.active) {
//          return this.tail.node
//       }
//    }

//    active = true;

//    deactivate(preserveNodes?: boolean) {
//       this.forEach((node) => {
//          node.deactivate(preserveNodes)
//       })
//       this.active = false;
//    }

//    activate(node?: DOMNode) {
//       if (node) this.node = node
//       this.active = true;
//    }

//    get prevNode(): DOMNode | undefined {
//       let prevNode = this.prev;
//       while (prevNode) {
//          if (prevNode.active) {
//             return prevNode.node
//          }
//          prevNode = prevNode.prev;
//       }
//       return prevNode
//    }

//    private _prev: IVineNode | undefined;
//    get prev() {
//       return this._prev;
//    }
//    set prev(node: IVineNode | undefined) {
//       this._prev = node;
//       if (this.head)
//          this.head.prev = node;
//    }
//    private _next: IVineNode | undefined;
//    get next() {
//       return this._next;
//    }
//    set next(node: IVineNode | undefined) {
//       this._next = node;
//       if (this.tail)
//          this.tail.next = node;
//    }

//    push(node: IVineNode) {
//       const result = super.push(node)
//       NodeVine.prototype.push.call(this, node)
//       return result;
//    }

//    splice(start: number, deleteCount: number, ...rest: unknown[]): any[] {
//       return super.splice(start, deleteCount, ...rest)
//    }

//    private insert() {

//    }

//    private remove() {

//    }

//    clear() {
//       this.length = 0;
//       this.head = undefined; //Need to break links down the tree
//       this.tail = undefined;
//    }

//    forActive() {

//    }
// }


// dynamicNodeVine.deactivate() // replace nodes with a placeholder
