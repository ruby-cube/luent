import { WatchedAtom } from "../quarky/src/watch/WatchedAtom";

export class EffectVine {
   private head: EffectLink | undefined
   private tail: EffectLink | undefined

   constructor(
      public __DEV__name: string
   ) {

   }

   private _size: number = 0;
   get size() {
      return this._size;
   }

   add(link: EffectLink) {
      const vine = link.vine;
      if (vine === this) return;
      vine?.unlink(link)

      this.appendNextIfIterating(link)

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

   private appendNextIfIterating(link: EffectLink | undefined) {
      if (this.current && this.current === this.tail) this.next = link
   }

   delete(link: EffectLink) {
      if (!this.has(link))
         return false;

      this.unlink(link)
      link.pass()
      return true;
   }

   private unlink(link: EffectLink) {
      this.storeNext(link, link)

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
      this._size--;
   }

   has(link: EffectLink) {
      return link.vine === this;
   }

   absorb(vine: EffectVine) {
      const head = vine.head;
      const tail = vine.tail;
      if (!tail) return;

      this.appendNextIfIterating(head)

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
      vine.pour(this)
   }

   private pour(destination?: EffectVine) {
      if (this.tail) this.storeNext(this.head!, this.tail)
      let current = this.head;
      while (current) { // we use while-loop instead of for...of because EffectVine's for...of does extra checks to allow list modification during iteration. We don't modify the list here, so we use a simple efficient loop.
         current.vine = destination;
         current = current.next
      }
      this.head = undefined;
      this.tail = undefined;
      this._size = 0
   }

   clear() {
      this.pour()
   }

   private current?: EffectLink | undefined
   private next?: EffectLink | undefined

   private storeNext(removalHead: EffectLink, removalTail: EffectLink) {
      if (removalHead !== this.current
         && removalHead !== this.next
      ) {
         return;
      }
      this.next = removalTail.next;
   }

   *[Symbol.iterator](): Iterator<EffectLink> {
      let current = this.current = this.head;
      while (current) {
         this.next = current.next;
         yield current;
         current = this.current = this.next
      }
      this.current = undefined;
      this.next = undefined;
   }
}





export class EffectLink {
   vine: EffectVine | undefined // can only belong to on vine at a time
   next: EffectLink | undefined
   prev: EffectLink | undefined

   constructor(
      public task: () => void,
      public watchSubject?: WatchedAtom
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

   remove() {
      this.vine?.delete(this)
   }
}