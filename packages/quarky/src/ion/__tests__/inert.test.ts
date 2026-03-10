import { describe, it, expect } from 'vitest';
import { inert, isInert, markInertProps } from '../../../../x-old/x_inert';

describe('inert', () => {
   it('should mark an object as inert', () => {
      const obj = { a: 1 };
      const inertObj = inert(obj);

      expect(isInert(inertObj)).toBe(true);
      expect(isInert(obj)).toBe(true);
   });

   it('should throw an error if a function is passed', () => {
      const func = () => { };
      expect(() => inert(func)).toThrow('Functions are inert by default');
   });

   it('should throw an error if a non-object is passed', () => {
      expect(() => inert(42 as any)).toThrow('Only objects can be marked as inert');
      expect(() => inert('string' as any)).toThrow('Only objects can be marked as inert');
   });
});

describe('isInert', () => {
   it('should correctly identify inert objects', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      inert(obj1);

      expect(isInert(obj1)).toBe(true);
      expect(isInert(obj2)).toBe(false);
   });
})

describe('markInertProps', () => {
   it('should mark specified properties as inert', () => {
      const obj = {
         a: { x: 1 },
         b: { y: { name: 2 } },
         c: 3,
      };

      const result = markInertProps(obj, {
         a: true,
         b: {
            y: true,
         },
      });

      expect(isInert(result.a)).toBe(true);
      expect(isInert(result.b)).toBe(false); // Only `b.y` is marked inert, not `b`.
      expect(isInert(result.b.y)).toBe(true);

      //@ts-expect-error
      expect(isInert(result.c)).toBe(false);
   });

   it('should handle nested properties', () => {
      const obj = {
         a: {
            x: { y: { z: { name: 1 } } },
         },
      };

      const result = markInertProps(obj, {
         a: {
            x: {
               y: {
                  z: true,
               },
            },
         },
      });

      expect(isInert(result.a.x.y.z)).toBe(true);
      expect(isInert(result.a.x.y)).toBe(false); // Only `y.z` is marked inert.
      expect(isInert(result.a.x)).toBe(false);
   });

   it('should not alter properties not included in the inert map', () => {
      const obj = {
         a: 1,
         b: { x: { name: 2 } },
      };

      const result = markInertProps(obj, {
         b: {
            x: true,
         },
      });

      //@ts-expect-error
      expect(isInert(result.a)).toBe(false);
      expect(isInert(result.b.x)).toBe(true);
   });

   it('should return the original object with inert properties applied', () => {
      const obj = {
         a: { x: 1 },
         b: { y: 2 },
      };

      const result = markInertProps(obj, {
         a: true,
      });

      expect(result).toBe(obj);
      expect(isInert(result.a)).toBe(true);
   });
});

