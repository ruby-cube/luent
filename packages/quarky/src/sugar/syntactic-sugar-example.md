I'd like to extend ts and tsx (as qrk and qrx) with the following syntactic sugar:

```tsx

// with syntactic sugar
function Counter({ showFractions@ }) {

   get count = Ion(0, {
      increment() {
         count@.value++
      }
   })
   get doubleCount = Ion((count * 2))

   const number@ = Ion(0) // assignment. Do not transform

   const something = {
      number@: Ion(0) // assignment. Do not transform
   }
   something.number@ = Ion(0) // assignment. Do not transform

   const { halfCount@, thirdCount@ } = FractionKit(count@)

   get halfCountB = FractionKit(count@).halfCount@

   return template(
      <div>
         <button on:click={e => count@.increment()}>+</button>
         <p>start: {count}</p>
         <p>count: {count@}</p>
         <p>doubleCount: {doubleCount@}</p>
         <p>tripleCount: {(count * 3)}</p>
         <button>{(showFractions ? 'hide':'show')} fractions</button>
         {If(showFractions@, (
		      <hr></hr>
            <p>halfCount: {(halfCount + '!')}</p>
            <p>thirdCount: {thirdCount@}</p>
         ))}
      </div>
   )
}
```

The above code should be transformed to the following as virtual source for the linter:

```tsx
import { ø, πø } from "@rue/quarky";

function Counter({ øshowFractions }: FromTag<{ showFractions: Ion<boolean> }>) {
  const øcount = Ion(0, {
    increment() {
      øcount.value++;
    },
  });
  const ødoubleCount = Ion(() => øcount() * 2);

  const { øhalfCount, øthirdCount } = destructureØ(FractionKit(øcount), 'øhalfCount', 'øthirdCount');

  return template(
    <div>
      <button on:click={(e) => øcount.increment()}>+</button>
      <p>start: {øcount()}</p>
      <p>count: {øcount}</p>
      <p>doubleCount: {ødoubleCount}</p>
      <p>tripleCount: {ø(() => øcount() * 3)}</p>
      <button>{øshowFractions() ? "hide" : "show"} fractions</button>
      {If(
        øshowFractions,
        <>
          <hr></hr>
          <p>halfCount: {øhalfCount}</p>
          <p>thirdCount: {øthirdCount}</p>
        </>,
      )}
    </div>,
  );
}
```


Sugar:
```tsx
function CounterKit() {
   get count = Ion(0)

   return {
      count@
      // comment
   }
}
```

Compiled:
```tsx
function CounterKit() {
  const øcount = Ion(0);

  return absorbØ({
      øcount,
      // comment
    }, ["øcount"]);
}
```


Sugar:
```tsx
function CounterKit() {

   return {
      get count: Ion(0)
   }
}
```

Compiled:
```tsx
function CounterKit() {
  return absorbØ({
      øcount: Ion(0),
    }, ["øcount"]);
}
```


Sugar:
```tsx
function FractionKit(count@) {
   get halfCount = Ion((count / 2))
   get thirdCount = Ion((count / 3))

   return {
      halfCount@,
      thirdCount@,
      normalProperty: 0
   }
}
```

Compiled:
```tsx
function FractionKit(count@) {
  const øhalfCount = Ion(() => øcount() / 2);
  const øthirdCount = Ion(() => øcount() / 3);

   return absorbØ({
      øhalfCount,
      øthirdCount
      normalProperty: 0
   }, ['øhalfCount', 'øthirdCount', 'normalProperty'])
}
```


Sugar:
```tsx
function FractionKit(count@) {

   return {
      get halfCount: Ion((count / 2)),
      get thirdCount: Ion((count / 3)),
      get something() {
         return 4;
      }
   }
}
```

Compiled:
```tsx
function FractionKit(count@) {

   return absorbØ({
      øhalfCount: Ion((count / 2)),
      øthirdCount: Ion((count / 3)),
      πøsomething: function something() {
         return 4;
      }
      normalProperty: 0
   }, ['øhalfCount', 'øthirdCount', 'πøsomething'])
}
```


Pre-ESLint/TSLint transforms

- transform get declarations: `get variable =` --> `const øvariable`
* transform all subsequent _reads_ of `get` variables with the `@` suffix to `øvariable`
  * do not transform declarations, assignment or reassignment of variables ending with `@` (see 'assignment' examples above)
- transform reads of `get` variables without `@` suffix: `variable` --> `øvariable()`
++ transform and object literals containing property shorthands with `@` suffix and/or containing an invalid `get` property declaration (`{ get property: value }`): 
`const obj = { property@ }` --> `const obj = absorbØ({ øproperty }, ['øproperty'])` 
`const obj = { get property: value }` --> `const obj = absorbØ({ øproperty: value }, ['øproperty'])`
(see more examples above)
   + import the getter absorber helper `absorbø` from '@rue/quarky' if it hasn't been imported yet.
* transform getter access for property access ending with `@`, whether through destructuring or dot notation (don't transform bracket notation):
  X e.g. destructuring `const { propertyA@, propertyB@, property } = obj` --> `const { property } = obj; const øpropertyA = πø(obj, 'propertyA'); const øpropertyB = πø(obj, 'propertyB');` (apply similar to destructured parameter objects as well)
  + e.g. destructuring `const { propertyA@, propertyB@, property } = obj` --> `const { øpropertyA, øpropertyB, property } = destructureØ(obj, 'øpropertyA', 'øpropertyB', 'property')`
  e.g. dot notation `get property = obj.property@` --> `const øproperty = πø(obj, 'property');`
  - import the getter access helper `πø` from '@rue/quarky' if it hasn't been imported yet
* similar to `get` variables, transform all subsequent reads of destructured variables with @ suffix to `øproperty` (e.g. thirdCount@ --> øthirdCount), but do not transform reassignments (see 'assignment' examples above)
- similar to `get` variables, transform reads of destructured getters (without @ suffex) to `øproperty()` (e.g. `showFractions` in the above example)

- transform jsx templates encased in extraneous parentheses:

```
(
   <div></div>
   <div></div>
)
```

-->

```
<>
   <div></div>
   <div></div>
</>
```

- transform extraneous parentheses surrounding any of the following:
  - the value of a property: `{ property: (value) }` --> `{ property: () => value }`
  - an argument: `doSomething((argument))` --> `doSomething(() => argument)`
  - an item in an array literal: `[(item), (itemB)]` --> `[() => item, () => itemB]`
  - note: browser DevTools pretty-print may visually show `fn( () => ...)`; verify raw transformed output (`?import`) for exact emitted spacing
- transform extraneous parentheses surrounding an expression within a JSX expression container:
  `<Comp value={(value + 1)}></Comp>` --> `<Comp value={ø(() => value + 1)}>`
  - also add an import statement if it doesn't already exist: `import { ø } from '@rue/quarky' }`

Typechecking pipeline (`quarky-tsc`)

* `.qrk` and `.qrx` files are virtualized as transformed `.ts`/`.tsx` for TypeScript typechecking.
- Authored sugar files are never rewritten on disk.
- Diagnostics are remapped from transformed virtual positions back to original sugar locations.
- Transformer single source of truth: `packages/quarky/scripts/transform-quarky-sugar.shared.cjs`.
- Quarky script entrypoint wrapper: `packages/quarky/scripts/transform-quarky-sugar.mjs`.
- TS Server plugin wrapper: `packages/quarky-tsserver-plugin/transform-quarky-sugar.cjs`.
- Run from root: `pnpm typecheck:quarky`
- Run from package: `pnpm -F @rue/quarky typecheck`
