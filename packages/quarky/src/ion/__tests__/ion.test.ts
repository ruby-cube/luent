import { describe, it, expect, vi } from 'vitest';
import { ion } from '../Ion';
import { MetaIon } from '../PrimaryIon';
import { createDerivationIon, DERIVED_ION } from '../../ionic/DerivationIon';
import exp from 'constants';

describe('ion function', () => {
    it('should create an AtomicIon when given a non-function value', () => {
        const atomicIon = ion(10);
        expect(typeof atomicIon).toBe('function');
        expect(isFunction(atomicIon)).toBe(false)
        expect(atomicIon()).toBe(10);
        expect(atomicIon[QUARKS]).toBeInstanceOf(MetaIon);
    });

    it('should invoke setValue when `value` is set', () => {
        const atomicIon = ion(15);
        const newValue = 25;
        atomicIon.value = newValue;

        expect(atomicIon()).toBe(newValue);
    });

    it('should attach methods to the ion when methods are provided', () => {
        const $count = ion(5, {
            double() {
                $count.state = $count() * 2
            }
        });

        $count.double()
        expect($count()).toBe(10);
        expect($count[QUARKS]).toBeInstanceOf(MetaIon);
    });

    it('should throw an error if .value is read', () => {
        const $count = ion(5, {
            double() {
                $count.state = $count() * 2
            }
        });

        expect(()=>$count.state).toThrowError();
        expect($count[QUARKS]).toBeInstanceOf(MetaIon);
    });
 

   //  it('should replace `as` method with `_as` if provided with `as` method', () => {
   //      const $count = ion(15, {
   //          as(value: number){
   //              $count.state = value;
   //          },
   //          double() {
   //              $count.state = $count() * 2
   //          }
   //      });

   //      const newValue = 25;
   //      $count.state = newValue;
   //      expect($count()).toBe(newValue);

   //      $count.double()
   //      expect($count()).toBe(50);

   //      $count.state = 2
   //      expect($count()).toBe(2);
   //  });

      it('should create a ReactiveDerivedIon when given a function', () => {
        const $count = ion(1)

        const $doubleCount = ion(() => $count() * 2);
        expect(typeof $doubleCount).toBe('function');
        expect(isFunction($doubleCount)).toBe(false)
        expect($doubleCount()).toBe(2);
        $count.state = 4
        expect($doubleCount()).toBe(8);
        expect($doubleCount[QUARKS].type).toBe(DERIVED_ION);
      });

      it('should create a derived ion that tracks dependencies correctly', () => {
        const depIon = ion(1);
        const derivedIon = ion(() => depIon() + 10);
        depIon.value = 2;  // update dependency

        expect(derivedIon()).toBe(12);
      });


    //   it('should return an existing ion without attaching new methods', () => {
    //     const existingIon = ion(30);
    //     const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    //     const ionWithMethods = ion(existingIon, { triple: () => {} });

    //     expect(ionWithMethods).toBe(existingIon);
    //     expect(warnSpy).toHaveBeenCalledWith(
    //       'Cannot make an existing ion into an ion. Methods will not be attached'
    //     );
    //     warnSpy.mockRestore();
    //   });

    //   it('should not track dependencies if inert flag is true', () => {
    //     const depIon = ion(1);
    //     const inertDerivedIon = createDerivationIon(() => depIon() * 2, {}, true);
    //     depIon.as(3);  // update dependency

    //     expect(inertDerivedIon()).toBe(2);  // unchanged due to inert flag
    //   });

});
