export function typeTest<T>(t: T){};

// https://github.com/TypeStrong/ts-expect/blob/master/src/index.ts
export type EqualTypes<Target, Value> = (<T>() => T extends Target
  ? 1
  : 2) extends <T>() => T extends Value ? 1 : 2
  ? true
  : false;