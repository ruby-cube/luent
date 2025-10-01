



# A Unified System of Reactivity




## A Unifying Reactive Primitive
What we need is an abstraction for reactive entities with connotations of reactivity, composability, and statefulness. Those things are called ions.


## The Dual Nature of Stateful References

The challenge in designing a reactive frontend framework is 

reactive reference

```ts
function createRef(initialState) {
   let state = initialState;

   const getter = () => state;

   const setter = (value) => state = value;

   Object.defineProperty(getter, 'value', {
      get: getter,
      set: setter,
   })

   return getter
}
```

When creating a 

```ts
function createIon(initialState) {
   const atom = {
      state: initialState
   }

   const getter = () => {
      track(atom)
      return atom.value
   };

   const setter = (value) => {
      trigger(atom)
      atom.value = value
   };

   Object.defineProperty(getter, 'value', {
      get: getter,
      set: setter,
   })

   return getter;
}
```


## The Syntax of Stateful Reference
A variable becomes a stateful reference when it is prefixed with a dollar sign, `$`, and assigned a getter function. A function is assumed to be a getter function if it takes in zero arguments.

```ts
const $count = ref(0)
```

## The Syntax of State Access
State is accessed simply 

## The Syntax of Reference Passing
When reassigning

## The Syntax of 