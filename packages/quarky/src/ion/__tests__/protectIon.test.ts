import { describe, it, expect, vi } from 'vitest';
import { META } from '../../ReactiveEntity';
import { IS_PUBLIC, protectIon, Public } from '../ProtectedIon';
import { ion } from '../Ion';
import { AnyObject } from '@rue/types';

describe('protectIon function', () => {
    //   it('should return a readonly ion when READONLY is passed', () => {
    //     const writableIon = { [META]: { inert: false, o: vi.fn(), hasMethods: true } };
    //     const readonlyIon = protectIon(writableIon, READONLY);

    //     expect(readonlyIon[META]).toHaveProperty('inert', false);
    //     expect(readonlyIon[META].asReadonly).toBe(readonlyIon);
    //     expect(readonlyIon[META].o).toBe(writableIon[META].o);
    //   });

    it('should return a protected ion with methods protected when no methodKeys are provided', () => {
        const atomicIon = ion(0)
        const $protected = protectIon(atomicIon);

        expect(() => $protected.as(10)).toThrowError()
        expect($protected[META].o).toBe(atomicIon[META].o);
    });

    it('should return a protected ion with `as` method protected when `as` is passed as a method', () => {
        const atomicIon = ion(0, {
            as() {

            }
        })
        const $protected = protectIon(atomicIon);

        expect(() => $protected.as(10)).toThrowError()
        expect(() => $protected._as(10)).toThrowError()
        expect($protected[META].o).toBe(atomicIon[META].o);
    });


    //   it('should create a custom protected ion with only specified methods accessible', () => {
    //     const writableIon = { [META]: { inert: false, o: vi.fn(), hasMethods: true } };
    //     const methodKeys = { allowedMethod: true };
    //     const customProtectedIon = protectIon(writableIon, methodKeys);

    //     expect(typeof customProtectedIon.allowedMethod).toBe('function');
    //     expect(customProtectedIon[META]).toBe(writableIon[META]);
    //     expect(customProtectedIon.as).toBe(undefined); // `as` should be protected
    //   });

   

    it('should call protectedMethod when restricted methods are accessed on a protected ion', () => {
        const atomicIon = ion(0, {
            increment() { }
        })
        const protectedIon = protectIon(atomicIon);

        expect(() => protectedIon.increment()).toThrowError(/failed/)
    });

    it('should reuse the existing protected ion if already created', () => {
        const atomicIon = ion(0)
        const protectedIon1 = protectIon(atomicIon);
        const protectedIon2 = protectIon(atomicIon);

        expect(protectedIon1).toBe(protectedIon2);
    });
});
