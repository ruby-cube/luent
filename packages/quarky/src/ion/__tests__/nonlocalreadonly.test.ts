import { describe, it, expect } from 'vitest';
import { ionize } from '../../ionize/ionize';
import { asNonlocalReadonly, isReadonly } from '../../NonlocalReadonly';
import { ion } from '../Ion';

describe('ionized object', () => {

  it('should prevent mutations on readonly object', () => {
    const frog = ionize({ name: 'kermit', setName(name: string) { this.name = name; } });
    const roFrog = asNonlocalReadonly(frog);
    expect(() => roFrog.setName('kermit')).toThrow();
    expect(() => { roFrog.name = 'kermit'; }).toThrow();
  });

  it('should return the same readonly instance', () => {
    const frog = ionize({ name: 'kermit' });
    expect(asNonlocalReadonly(frog)).toBe(asNonlocalReadonly(frog));
  });

  it('should be readonly', () => {
    const frog = ionize({ name: 'kermit' });
    expect(isReadonly(asNonlocalReadonly(frog))).toBe(true);
  });
});

describe('ionized class', () => {
  class FrogPrince {
    constructor(public name: string) {}
    qualities = [];
    setName(name: string) { this.name = name; }
  }

  it('should prevent mutations on readonly instance', () => {
    const frogPrince = ionize(new FrogPrince('sir robin'));
    const roFrog = asNonlocalReadonly(frogPrince);
    expect(() => roFrog.setName('kermit')).toThrow();
    expect(() => roFrog.name = 'kermit').toThrow();
  });
});

describe('ion', () => {
  it('should prevent state modification on readonly ion', () => {
    const $count = ion(0, { increment() { $count.state++; } });
    const $roCount = asNonlocalReadonly($count);
    $roCount.state = 10;
    expect($roCount()).toBe(0)
    expect(() => $roCount.increment()).toThrow();
  });

  it('should return the same readonly instance', () => {
    const $count = ion(0);
    expect(asNonlocalReadonly($count)).toBe(asNonlocalReadonly($count));
  });
});

describe('plain object', () => {

  it('should prevent mutations on readonly object', () => {
    const kermie = { name: 'kermie', setName(name: string) { this.name = name; } };
    const roFrog = asNonlocalReadonly(kermie);
    expect(() => roFrog.setName('kermit')).toThrow();
    expect(() => roFrog.name = 'kermit').toThrow();
  });
});

describe('deep readonly', () => {
  class FrogPrince {
    constructor(public name: string) {}
    qualities = [];
  }

  it('should preserve readonly for deep properties', () => {
    const frogPrince = new FrogPrince('sir robin');
    const roFrogPrince = asNonlocalReadonly(frogPrince);
    expect(isReadonly(roFrogPrince.qualities)).toBe(true);
    expect(isReadonly(frogPrince.qualities)).toBe(false);
  });
});
