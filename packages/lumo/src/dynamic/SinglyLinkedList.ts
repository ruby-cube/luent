import { VineNode } from "./NodeVine";

class AbstractVineNode {
   protected _prev: AbstractVineNode | undefined;
   public get prev(): AbstractVineNode | undefined {
      return this._prev;
   }
   public set prev(value: AbstractVineNode | undefined) {
      this._prev = value;
   }
   vine: NestableVine | undefined

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

   private isHead(): this is { vine: NestableVine } {
      return !!this.vine && this.vine.head === this
   }
   private isTail(): this is { vine: NestableVine } {
      return !!this.vine && this.vine.tail === this
   }
}

class StaticNode extends AbstractVineNode {
   constructor(
      public value: any
   ) {
      super()
   }
}

// type INode = {
//    prev: INode | undefined
// }

class NestableVine extends AbstractVineNode {
   head: AbstractVineNode | undefined
   tail: AbstractVineNode | undefined

   public get prev(): AbstractVineNode | undefined {
      return this._prev;
   }
   public set prev(value: AbstractVineNode | undefined) {
      this._prev = value;
      if (this.head)
         this.head.prev = value; // descendent head(s) inherit .prev value through chain reaction
   }

   push(value: any | NestableVine) {
      if (value instanceof NestableVine) {
         assertUnlinked(value)
      }
      const newNode = value instanceof AbstractVineNode ? value : new StaticNode(value);
      const oldTail = this.tail;
      this.tail = newNode;
      this.vine = this;
      if (!this.head) {
         this.head = newNode;
      }
      else if (oldTail) {
         newNode.prev = oldTail;
      }
   }

   get leafTail(): VineNode | undefined {
      const tail = this.tail
      if (tail instanceof NestableVine)
         return this.leafTail;
      return tail as VineNode | undefined;
   }

   forLeaf(task: (node: VineNode) => void) {
      let current = this.leafTail;
      while (current) {
         task(current)
         current = this.prevLeaf;
      }
   }

   get prevLeaf(): VineNode | undefined {
      return this.prev instanceof NestableVine ? (this.prev.leafTail || this.prev.prevLeaf) : (this.prev as VineNode | undefined);
   }

   forActive(task: (node: VineNode) => void) {
      let current: VineNode | undefined = this.leafTail;
      while (current) {
         task(current)
         current = this.prevLeaf
      }
   }

   active: boolean = true;
   deactivate() {
      this.active = false;
   }
   activate() {
      this.active = true;
   }
}

function assertUnlinked(vine: NestableVine) {
   if (vine.prev) throw new Error('DEV RESEARCH: Vine is already linked! This means it wasn not properly removed previously')
   if (vine.vine) throw new Error('DEV RESEARCH: Vine is the child of another vine! This should never happen...')
}

