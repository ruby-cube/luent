import { DOMNode } from "../component/InternalComponent";

class AbstractVineNode {
   protected _prev: AbstractVineNode | undefined;
   public get prev(): AbstractVineNode | undefined {
      return this._prev;
   }
   public set prev(value: AbstractVineNode | undefined) {
      this._prev = value;
   }
   vine: NodeVine | undefined
   // get vine() {
   //    return this._vine
   // }
   // set vine(value: NodeVine | undefined) {
   //    console.trace('setting vine', this)
   //    this._vine = value;
   // }
   // TEST CASE: this is head
   // TEST CASE: this is tail
   // TEST CASE: this is body
   insertPrev(value: AbstractVineNode | any) {
      const node = value instanceof AbstractVineNode ? value : new StaticNode(value);

      node.vine = this.vine;
      node.prev = this.prev;
      this.prev = node;

      if (this.isHead())
         this.vine.head = node;
   }

   // TEST CASE: this is head
   // TEST CASE: this is tail
   // TEST CASE: this is body
   remove() {
      const vine = this.vine;
      const prev = this.prev;
      const isHead = this.isHead()
      if (!vine) return;
      this.prev = undefined
      this.vine = undefined;

      if (this.isTail())
         vine.tail = prev;

      const timeout = setTimeout(() => {
         throw new Error(`.relink() must be called `)
      }, 1)

      return {
         relink: (next: AbstractVineNode | undefined) => {
            clearTimeout(timeout)
            if (next && next.prev !== this) throw new Error(`The provided 'next' is not this node's next`)
            if (next) next.prev = vine.prev;
            if (isHead)
               vine.head = next;
         }
      }
   }

   private isHead(): this is { vine: NodeVine } {
      return !!this.vine && this.vine.head === this
   }
   private isTail(): this is { vine: NodeVine } {
      return !!this.vine && this.vine.tail === this
   }
}

class StaticNode extends AbstractVineNode {
   constructor(
      public value: DOMNode
   ) {
      super()
   }
}

// type INode = {
//    prev: INode | undefined
// }

export class NodeVine extends AbstractVineNode {
   head: AbstractVineNode | undefined
   tail: AbstractVineNode | undefined

   constructor(
      public name?: string
   ) {
      super()
   }

   // MUTATION

   push(value: DOMNode | NodeVine) {
      if (value instanceof NodeVine) {
         assertUnlinked(value as NodeVine)
      }
      const newNode = value instanceof AbstractVineNode ? value : new StaticNode(value);
      const oldTail = this.tail;
      this.tail = newNode;
      newNode.vine = this as NodeVine;
      if (!this.head) {
         this.head = newNode;
      }
      else if (oldTail) {
         newNode.prev = oldTail;
      }
   }

   clear() {
      this.forEachChild(node => {
         node.vine = undefined
      })
      this.head = undefined;
      this.tail = undefined;
   }


   // TRAVERSAL

   public get prev(): AbstractVineNode | undefined {
      return this._prev;
   }
   public set prev(value: AbstractVineNode | undefined) {
      this._prev = value;
      if (this.head)
         this.head.prev = value; // descendent head(s) inherit .prev value through chain reaction
   }

   get leafTail(): StaticNode | undefined {
      const tail = this.tail
      if (tail instanceof NodeVine)
         return tail.leafTail;
      return tail as StaticNode | undefined;
   }

   get activeLeafTail(): StaticNode | undefined {
      let tail = this.tail
      while (tail instanceof NodeVine && !tail.active) {
         tail = tail.prev
      }
      if (tail instanceof NodeVine)
         return tail.leafTail;
      return tail as StaticNode | undefined;
   }

   get prevLeaf(): StaticNode | undefined {
      let prev = this.prev;
      while (prev instanceof NodeVine && !prev.active) {
         prev = prev.prev;
      }
      return prev instanceof NodeVine ? (prev.activeLeafTail || prev.prevLeaf) : (prev as StaticNode | undefined);
   }

   get prevViewNode(): DOMNode | undefined {
      return this.prevLeaf?.value;
   }


   // LOOPS

   forEachChild(task: (node: AbstractVineNode) => void) {
      let current = this.tail;
      while (current) {
         task(current)
         current = current.prev;
      }
   }

   forEach(task: (value: DOMNode) => void) {
      let current: StaticNode | NodeVine | undefined = this.leafTail;
      while (current) {
         if (current instanceof NodeVine) {
            current = current.leafTail
            continue;
         }
         task(current.value)
         current = current.prev as StaticNode | NodeVine | undefined;
      }
   }



   // forActive(task: (node: StaticNode) => void) {
   //    let current: StaticNode | undefined = this.leafTail;
   //    while (current) {
   //       task(current)
   //       current = current.prevLeaf
   //    }
   // }

   

   active: boolean = false;
   deactivate() {
      this.active = false;
   }
   activate() {
      this.active = true;
   }

   get isEmpty() {
      return this.head === undefined
   }

   get asArray() {
      const array: AbstractVineNode[] = [];
      this.forEachChild(node =>
         array.push(node)
      )
      return array.reverse();
   }
}

function assertUnlinked(vine: NodeVine) {
   if (vine.prev) throw new Error('DEV RESEARCH: Vine is already linked! This means it wasn not properly removed previously')
   if (vine.vine) throw new Error('DEV RESEARCH: Vine is the child of another vine! This should never happen...')
}

