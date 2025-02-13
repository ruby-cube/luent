import { Watched } from "./Watched";

export class EffectVine {
   private head: EffectLink | undefined
   private tail: EffectLink | undefined

   private _size: number = 0;
   get size() {
      return this._size;
   }

   add(link: EffectLink) {
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

   delete(link: EffectLink) {
      if (!this.has(link))
         return false;
      this.unlink(link)
      link.pass()
      this._size--;
      return true;
   }

   private unlink(link: EffectLink) {
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

   has(link: EffectLink) {
      return link.vine === this;
   }

   absorb(vine: EffectVine) {
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

   *[Symbol.iterator](): Iterator<EffectLink> {
      let current = this.head;
      while (current) {
         yield current;
         current = current.next
      }
   }

}


// interface EffectLink<T> {
//    vine: EffectVine | undefined // can only belong to on vine at a time
//    next: T | undefined
//    prev: T | undefined
//    pass(vine?: EffectVine, prev?: T): void
// }

export class EffectLink {
   vine: EffectVine | undefined // can only belong to on vine at a time
   next: EffectLink | undefined
   prev: EffectLink | undefined

   constructor(
      public task: () => void,
      public watched?: Watched
   ) { }

   /**
    * Reassigns a link's vine and prev properties.
    * @param vine EffectVine | undefined
    * @param prev EffectLink | undefined
    */
   pass(vine?: EffectVine, prev?: EffectLink) {
      this.prev = prev
      this.vine = vine
   }
}