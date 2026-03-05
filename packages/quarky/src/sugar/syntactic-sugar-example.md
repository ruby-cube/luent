const øfrog = {name: 'kermit'}

I'd like to extend ts and tsx (as lue and qrx) with the following syntactic sugar:

```tsx

// with syntactic sugar
function Counter({ showFractions@ }) {

   get count = Ion(0, {
      increment() {
         count@.value++
      }
   })
   get doubleCount = Ion((count * 2))

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

function FractionKit(count@) {
   return {
      halfCount@: Ion((count / 2)),
      thirdCount@: Ion((count / 3))
   }
}

```

The above code should be transformed to the following as virtual source for the linter:

```tsx
import { ø, øø } from "@rue/quarky"

function Counter({ øshowFractions }: FromTag<{ showFractions: Ion<boolean> }>) {

   const øcount = Ion(0, {
      increment() {
         øcount.value++
      }
   })
   const ødoubleCount = Ion(() => øcount() * 2)

   const { øhalfCount, øthirdCount } = FractionKit(øcount)

   return template(
      <div>
         <button on:click={e => øcount.increment()}>+</button>
         <p>start: {øcount()}</p>
         <p>count: {øcount}</p>
         <p>doubleCount: {ødoubleCount}</p>
         <p>tripleCount: {ø(() => øcount() * 3)}</p>
         <button>{(øshowFractions() ? 'hide':'show')} fractions</button>
         {If(øshowFractions, 
            <>
               <hr></hr>
               <p>halfCount: {øhalfCount}</p>
               <p>thirdCount: {øthirdCount}</p>
            </>
         )}
      </div>
   )
}

function FractionKit(øcount: Ion<number>) {

   const øhalfCount = Ion(() => øcount() / 2);
   const øthirdCount = Ion(() => øcount() / 3);

   return {
      get halfCount() {return øhalfCount() },
      get thirdCount() {return øthirdCount() }
   }
}

```

Pre-ESLint/TSLint transforms
+ transform get declarations: `get variable =` --> `const øvariable`
+ transform all usages of `get` variables to `øvariable`
+ transform reads of `get` variables: `variable` --> `øvariable()`
+ transform variables ending with `@`: `variable@` --> øvariable`
+ for property variables ending with `@`, add an accessor property: `{ property@: value }` --> `const øproperty = value;` + `{ get property() { return øproperty(); }}`
+ transform getter access for property access ending with `@`, whether through destructuring or dot notation (don't transform bracket notation):
   e.g. destructuring `const { propertyA@, propertyB@, property } = obj` --> `const { property } = obj; const øpropertyA = øø(obj, 'propertyA'); const øpropertyB = øø(obj, 'propertyB');` (apply similar to destructured parameter objects as well)
   e.g. dot notation `get property = obj.property@` --> `const øproperty = øø(obj, 'property');`
   + import the getter access helper `øø` from '@rue/quarky' if it hasn't been imported yet
+ similar to `get` variables, transform all subsequent usages of destructured getters (ending with @) to `øproperty` (e.g. thirdCount@ --> øthirdCount)
+ similar to `get` variables, transform reads of destructured getters (variable name without @) to `øproperty()` (e.g. `showFractions` in the above example)
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
- transform extraneous parentheses surrounding an expression within a JSX expression container:
   `<Comp value={(value + 1)}></Comp>` --> `<Comp value={ø(() => value + 1)}>`
   - also add an import statement if it doesn't already exist: `import { ø } from '@rue/quarky' }`

Typechecking pipeline (`quarky-tsc`)
- `.lue` and `.qrx` files are virtualized as transformed `.ts`/`.tsx` for TypeScript typechecking.
- Authored sugar files are never rewritten on disk.
- Diagnostics are remapped from transformed virtual positions back to original sugar locations.
- Transformer single source of truth: `packages/quarky/scripts/transform-quarky-sugar.shared.cjs`.
- Quarky script entrypoint wrapper: `packages/quarky/scripts/transform-quarky-sugar.mjs`.
- TS Server plugin wrapper: `packages/quarky-tsserver-plugin/transform-quarky-sugar.cjs`.
- Run from root: `pnpm typecheck:quarky`
- Run from package: `pnpm -F @rue/quarky typecheck`


