import { EffectLink, EffectVine } from "./EffectLink"
import { describe, it, expect } from 'vitest';

// const vine = new EffectVine('')
// list.add(item)
// list.clear()
// list.delete(item)
// list.absorb(listB)
// list.has(item)

// Please write vitest test for a linked list with the following methods:

// ```
// list.add(item)
// list.clear()
// list.delete(item)
// list.absorb(listB)
// list.has(item)
// ```

// (Note: the absorb method essentially adds all items in listB while also removing all items from listB)

// and the following requirement:
// - items are exclusive to a list, meaning if you add an item to listA that is already in listB, it will automatically delete that item from listB
// - the linked list is iterable and can be modified via its methods while iterating without messing up iteration. 
//   - If a new item is added during iteration, the new item will be queued to the end of the list and iterated over.
//   - Items can be removed before they are iterated over, whether they are the next item to be iterated over or further down the line.
//   - items can be removed while being iterated over.



describe('EffectVine', () => {
   it('should add an item to the list', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      list.add(a);
      expect(list.has(a)).toBe(true);
      expect(list.size).toEqual(1);
   });

   it('should clear the list', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      expect(list.size).toEqual(2);
      list.clear();
      expect([...list]).toEqual([]);
      expect(list.size).toEqual(0);
   });

   it('should delete an item from the list', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      list.add(a);
      expect(list.has(a)).toBe(true);
      list.delete(a);
      expect(list.has(a)).toBe(false);
   });

   it('should absorb another list and remove items from the absorbed list', () => {
      const listA = new EffectVine("");
      const listB = new EffectVine("");
      const a = new EffectLink(() => { })
      listB.add(a);
      listA.absorb(listB);
      expect(listA.has(a)).toBe(true);
      expect([...listB]).toEqual([]);
   });

   // Absorb test cases
   const absorbCases = [
      { a: [], b: [] },
      { a: [], b: [new EffectLink(() => { })] },
      { a: [], b: [new EffectLink(() => { }), new EffectLink(() => { })] },
      { a: [], b: [new EffectLink(() => { }), new EffectLink(() => { }), new EffectLink(() => { })] },
      { a: [new EffectLink(() => { })], b: [] },
      { a: [new EffectLink(() => { }), new EffectLink(() => { })], b: [] },
      { a: [new EffectLink(() => { }), new EffectLink(() => { }), new EffectLink(() => { })], b: [] },
      { a: [new EffectLink(() => { })], b: [new EffectLink(() => { })] },
      { a: [new EffectLink(() => { })], b: [new EffectLink(() => { }), new EffectLink(() => { })] },
      { a: [new EffectLink(() => { })], b: [new EffectLink(() => { }), new EffectLink(() => { }), new EffectLink(() => { })] },
      { a: [new EffectLink(() => { }), new EffectLink(() => { })], b: [new EffectLink(() => { })] },
      { a: [new EffectLink(() => { }), new EffectLink(() => { }), new EffectLink(() => { })], b: [new EffectLink(() => { })] },
      { a: [new EffectLink(() => { }), new EffectLink(() => { })], b: [new EffectLink(() => { }), new EffectLink(() => { })] },
      { a: [new EffectLink(() => { }), new EffectLink(() => { })], b: [new EffectLink(() => { }), new EffectLink(() => { }), new EffectLink(() => { })] },
      { a: [new EffectLink(() => { }), new EffectLink(() => { }), new EffectLink(() => { })], b: [new EffectLink(() => { }), new EffectLink(() => { })] },
   ];

   absorbCases.forEach(({ a, b }, index) => {
      it(`should absorb another list and remove items from the absorbed list. Case ${index + 1}`, () => {
         const listA = new EffectVine("");
         const listB = new EffectVine("");
         a.forEach(item => listA.add(item));
         b.forEach(item => listB.add(item));
         listA.absorb(listB);
         b.forEach(item => expect(listA.has(item)).toBe(true));
         expect([...listB]).toEqual([]);
      });
   });

   it('should ensure items are exclusive between lists', () => {
      const listA = new EffectVine("");
      const listB = new EffectVine("");
      const x = new EffectLink(() => { })
      listA.add(x);
      listB.add(x);
      expect(listA.has(x)).toBe(false);
      expect(listB.has(x)).toBe(true);
   });

   it('should iterate correctly when adding to the list. Case: Add during at(-2)', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === b) list.add(d); // Should be iterated after c
      }
      expect(iterated).toEqual([a, b, c, d]);
   });

   it('should iterate correctly when adding to the list. Case: Add during at(-1)', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === c) list.add(d); // Should be iterated after c
      }

      expect(iterated).toEqual([a, b, c, d]);
   });

   it('should iterate correctly when adding to the list. Case: Absorb during at(-1)', () => {
      const list = new EffectVine("");
      const listB = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      const e = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      listB.add(d)
      listB.add(e)

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === c) list.absorb(listB); // Should be iterated after c
      }

      expect(iterated).toEqual([a, b, c, d, e]);
   });

   it('should iterate correctly when deleting from the list. Case: Delete self during at(-3)', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      list.add(d);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === b) list.delete(b);
      }

      expect(iterated).toEqual([a, b, c, d]);
   });

   it('should iterate correctly when deleting from the list. Case: Delete next during at(-3)', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      list.add(d);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === b) list.delete(c);
      }

      expect(iterated).toEqual([a, b, d]);
   });

   it('should iterate correctly when deleting from the list. Case: Delete next + 1 during at(-3)', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      list.add(d);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === b) list.delete(d);
      }

      expect(iterated).toEqual([a, b, c]);
   });

   it('should iterate correctly when deleting consecutive items from the list. Case: Delete self + 1 during at(-3)', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      list.add(d);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === a) {
            list.delete(a);
            list.delete(b);
         }
      }

      expect(iterated).toEqual([a, c, d]);
   });

   it('should iterate correctly when deleting consecutive items from the list. Case: Delete self + 2', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      list.add(d);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === a) {
            list.delete(a);
            list.delete(b);
            list.delete(c);
         }
      }

      expect(iterated).toEqual([a, d]);
   });

   it('should iterate correctly when deleting consecutive items from the list. Case: Delete next + 1', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      list.add(d);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === a) {
            list.delete(b);
            list.delete(c);
         }
      }

      expect(iterated).toEqual([a, d]);
   });

   it('should iterate correctly when deleting consecutive items from the list. Case: Delete next + 2', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      const e = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);
      list.add(d);
      list.add(e);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === a) {
            list.delete(b);
            list.delete(c);
            list.delete(d);
         }
      }

      expect(iterated).toEqual([a, e]);
   });

   it('should iterate correctly when adding to and deleting from the list', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === b) {
            list.add(d); 
            list.delete(c);
         }
      }

      expect(iterated).toEqual([a, b, d]);
   });
   it('should iterate correctly when deleting from and adding to the list', () => {
      const list = new EffectVine("");
      const a = new EffectLink(() => { })
      const b = new EffectLink(() => { })
      const c = new EffectLink(() => { })
      const d = new EffectLink(() => { })
      list.add(a);
      list.add(b);
      list.add(c);

      const iterated = [];
      for (const item of list) {
         iterated.push(item);
         if (item === b) {
            list.delete(c);
            list.add(d); 
         }
      }

      expect(iterated).toEqual([a, b, d]);
   });
});



