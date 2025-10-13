export class IterableSet<T> {
   private arr: T[] = [];
   private indexMap = new Map<T, number>(); // Maps value → index in arr

   constructor() {
      this.has = this.indexMap.has.bind(this.indexMap)
   }

   get size(){
      return this.indexMap.size
   }

   add(value: T) {
      if (this.indexMap.has(value)) return this; // Avoid duplicates
      this.indexMap.set(value, this.arr.length);
      this.arr.push(value);
   }

   has: (value: T) => boolean

   delete(value: T): boolean {
      if (!this.indexMap.has(value)) return false;

      const index = this.indexMap.get(value)!;
      this.indexMap.delete(value);

      // Swap and pop: O(1) deletion from array
      const last = this.arr.pop();
      if (index < this.arr.length && last !== undefined) {
         this.arr[index] = last;
         this.indexMap.set(last, index);
      }
      return true;
   }

   *[Symbol.iterator]() {
      yield* this.arr; // Fast iteration via array // TODO: need to be able to delete while iterating and not mess things up
   }
}
