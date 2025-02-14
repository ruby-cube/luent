
export class ExclusiveVine {
   private head: ExclusiveLink | undefined
   private tail: ExclusiveLink | undefined

   private _size: number = 0;
   get size() {
      return this._size;
   }

   add(link: ExclusiveLink) {
      const vine = link.vine;
      if (vine === this) return;

      vine?.unlink(link)

      // link vine
      if (!this.head) {
         this.head = link
      }

      const tail = this.tail
      if (tail) tail.next = link
      this.tail = link

      link.pass(this, tail)

      this._size++;
      return link;
   }

   delete(link: ExclusiveLink) {
      if (!this.has(link))
         return false;
      this.unlink(link)
      link.pass()
      this._size--;
      return true;
   }

   private unlink(link: ExclusiveLink) {
      // unlink from vine
      const prevLink = link.prev;
      const nextLink = link.next;

      if (this.head === link) {
         this.head = nextLink;
      }
      if (this.tail === link) {
         this.tail = prevLink;
      }

      if (prevLink) {
         prevLink.next = nextLink;
      }
      if (nextLink) {
         nextLink.prev = prevLink;
      }

      link.next = undefined;
   }

   has(link: ExclusiveLink) {
      return link.vine === this;
   }

   absorb(vine: ExclusiveVine) {
      const head = vine.head;
      const tail = vine.tail;
      if (!tail) return;
      vine.head = undefined
      vine.tail = undefined

      for (const link of vine) {
         link.vine = this
      }
      const thisTail = this.tail;
      if (!thisTail) {
         this.head = head;
      }
      this.tail = tail
      if (thisTail) {
         thisTail.next = head;
         head!.prev = thisTail;
      }
      this._size += vine._size;
   }

   clear() {
      this.head = undefined;
      this.tail = undefined;
      for (const link of this) {
         link.vine = undefined
      }
      this._size = 0
   }

   *[Symbol.iterator](): Iterator<ExclusiveLink> {
      let current = this.head;
      while (current) {
         yield current;
         current = current.next
      }
   }

}


// interface ExclusiveLink<T> {
//    vine: ExclusiveVine | undefined // can only belong to on vine at a time
//    next: T | undefined
//    prev: T | undefined
//    pass(vine?: ExclusiveVine, prev?: T): void
// }

export class ExclusiveLink {
   vine: ExclusiveVine | undefined // can only belong to on vine at a time
   next: ExclusiveLink | undefined
   prev: ExclusiveLink | undefined

   constructor(
      public value: unknown,
   ) { }

   /**
    * Reassigns a link's vine and prev properties.
    * @param vine ExclusiveVine | undefined
    * @param prev ExclusiveLink | undefined
    */
   pass(vine?: ExclusiveVine, prev?: ExclusiveLink) {
      this.prev = prev
      this.vine = vine
   }
}