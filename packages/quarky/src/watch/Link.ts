class ExclusivePod {
   private head: ExclusiveLink | undefined
   private tail: ExclusiveLink | undefined

   add(link: ExclusiveLink) {
      const pod = link.pod;
      if (pod === this) return;

      pod?.unlink(link)

      // link pod
      if (!this.head) {
         this.head = link
      }

      const tail = this.tail
      if (tail) tail.next = link
      this.tail = link

      link.pass(this, tail)
      return link;
   }

   delete(link: ExclusiveLink) {
      if (!this.has(link)) return false;
      this.unlink(link)
      link.pass()
      return true;
   }

   private unlink(link: ExclusiveLink) {
      // unlink from pod
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
      return link.pod === this;
   }

   absorb(pod: ExclusivePod) {
      const head = pod.head;
      const tail = pod.tail;
      if (!tail) return;
      pod.head = undefined
      pod.tail = undefined
      pod.forEach(link => {
         link.pod = this
      })
      const thisTail = this.tail;
      if (!thisTail) {
         this.head = head;
      }
      this.tail = tail
      if (thisTail) {
         thisTail.next = head;
         head!.prev = thisTail;
      }
   }

   clear() {
      this.head = undefined;
      this.tail = undefined;
      this.forEach(link => {
         link.pod = undefined
      })
   }

   forEach(task: (link: ExclusiveLink) => void) {
      let current = this.head;
      while (current) {
         task(current)
         current = current.next
      }
   }
}

class ExclusiveLink {
   pod: ExclusivePod | undefined // can only belong to on pod at a time
   next: ExclusiveLink | undefined
   prev: ExclusiveLink | undefined

   constructor(
      public value: any
   ) {

   }

   /**
    * Reassigns a link's pod and prev properties.
    * @param pod ExclusivePod | undefined
    * @param prev ExclusiveLink | undefined
    */
   pass(pod?: ExclusivePod, prev?: ExclusiveLink) {
      this.prev = prev
      this.pod = pod
   }
}