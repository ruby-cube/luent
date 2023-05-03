
export type MiscObj = { [key: string | number | symbol]: any }

export type Identity<T> = { // Flattens intersection
  [P in keyof T]: T[P]
};

export type Consolidate<T> = { // Flattens intersection and removes index signatures
  [P in keyof T as string extends P ? never : number extends P ? never : P]: T[P]
};

// make Readonly type writeable
export type Writable<T extends Readonly<{}>> = { -readonly [P in keyof T]: T[P] };

// export type RemoveKeys<T, K extends string | number | symbol> = Omit<Consolidate<T>, K>


export type Clean<T, K extends string | number | symbol> = Omit<Consolidate<T>, K>;

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type TypeCheck<T extends X, X> = T;

export type NullMap<A extends {}> = { [Property in keyof A]: null };

export type PrivateKeys<K extends string | number | symbol> = K extends string ? K extends `_${infer CoreKey}` ? `_${CoreKey}` : never : never;
export type Public<T> = Omit<T, PrivateKeys<keyof T>>

export type FunctionType<F extends (...args: any) => any> = (...args: Parameters<F>) => ReturnType<F>



// export type VPropsType<T> = Readonly<
// LooseRequired<
//   Readonly<ExtractPropTypes<T>> & {
//     [x: `on${string}]:
//       | ((...args: any[]) => any)
//       | ((...args: unknown[]) => any);
//   }
// >
// >

export type ReKey<T, R> = {
  [K in keyof T as K extends keyof R
  ? R[K] extends string
  ? R[K]
  : never
  : K]: K extends keyof T ? T[K] : never;
};

export type UnNested<T> = UnionToIntersection<T[keyof T]>;

// creates intersection of an object types values, assuming values are also object types
export type ValueIntersection<T extends Object> = {
  [K in keyof T]: (x: T[K]) => void
}[keyof T] extends
  (x: infer I) => void ? I : never;


export type ArrayToUnion<A extends any[]> = A[number];
export type ArrayToIntersection<A extends any[]> = UnionToIntersection<A[number]>;


export type MutableObject = { [key: string | symbol | number]: any };
export type Mutable<T> = T & {[Key in keyof T]: T[Key]};

export type Cast = unknown; // force type casting

export type Class = {
  prototype: Object;
  new(...args: any[]): Object;
};




/**
 * Construct a type with the properties of T except for those in type K.
 */
export type Skip<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;