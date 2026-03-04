I'd like to extend ts and tsx (as lue and luex) with the following syntactic sugar:

```tsx

// with syntactic sugar
function Counter({ showFractions@ }) {

   get count = Ion(0, {
      increment() {
         count++
      }
   })
   get doubleCount = Ion((count * 2))

   const { halfCount@, thirdCount@ } = FractionKit(count@)

   return template(
      <div>
         <button on:click={e => count@.increment()}>+</button>
         <p>start: {count}</p>
         <p>count: {count@}</p>
         <p>doubleCount: {doubleCount@}</p>
         <p>tripleCount: {(count * 3)}</p>
         {If(showFractions@, (
		      <hr></hr>
            <p>halfCount: {halfCount@}</p>
            <p>thirdCount: {thirdCount@}</p>
         ))}
      </div>
   )
}

function FractionKit(count@) {
   return {
      get halfCount: Ion((count / 2)),
      get thirdCount: Ion((count / 3))
   }
}

```

The above code should be transformed to the following as virtual source for the linter:

```tsx
import { $_derivation } from "@rue/quarky"

function Counter({ $showFractions }: FromTag<{ showFractions: Ion<boolean> }>) {

   const $count = Ion(0, {
      increment() {
         $count.value++
      }
   })
   const $doubleCount = Ion(() => $count() * 2)

   const { $halfCount, $thirdCount } = FractionKit($count)

   return template(
      <div>
         <button on:click={e => $count.increment()}>+</button>
         <p>start: {$count()}</p>
         <p>count: {$count}</p>
         <p>doubleCount: {$doubleCount}</p>
         <p>tripleCount: {$_derivation(() => $count() * 3)}</p>
         {If($showFractions, 
            <>
               <hr></hr>
               <p>halfCount: {$halfCount}</p>
               <p>thirdCount: {$thirdCount}</p>
            </>
         )}
      </div>
   )
}

function FractionKit($count: Ion<number>) {
   return {
      $halfCount: Ion(() => $count() / 2),
      $thirdCount: Ion(() => $count() / 3)
   }
}

```

Pre-ESLint/TSLint transforms
- transform get declarations: `get variable =` --> `const $variable`
- transform all usages of `get` variables to `$variable`
- transform reassignments of `get` variables: `$variable++` --> `$variable.value++`, `$variable = value` --> `$variable.value = value`, etc
- transform reads of `get` variables: `variable` --> `$variable()`
- transform variables ending with `@`: `variable@` --> $variable`
- transform get accessors that are not assigned with a function expression: `{ get property: nonFunctionExpression }` --> `{ $property: nonFunctionExpression }`
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
   `<Comp value={(value + 1)}></Comp>` --> `<Comp value={$_derivation(() => value + 1)}>`
   - also add an import statement if it doesn't already exist: `import { $_derivation } from '@rue/quarky' }`

Typechecking pipeline (`quarky-tsc`)
- `.lue` and `.luex` files are virtualized as transformed `.ts`/`.tsx` for TypeScript typechecking.
- Authored sugar files are never rewritten on disk.
- Diagnostics are remapped from transformed virtual positions back to original sugar locations.
- Current transform entrypoint: `packages/quarky/scripts/transform-quarky-sugar.mjs`.
- Run from root: `pnpm typecheck:quarky`
- Run from package: `pnpm -F @rue/quarky typecheck`

Debugging transform + mapped diagnostics (`quarky-sugar-debug`)
- Prints transformed virtual code for a single `.lue`/`.luex` file.
- Prints TypeScript diagnostics for that transformed file with both transformed and original ranges.
- Run default sample from root: `pnpm debug:quarky-sugar`
- JSON mode from root: `pnpm debug:quarky-sugar:json`
- Run specific file from root: `pnpm exec node packages/quarky/scripts/quarky-sugar-debug.mjs packages/quarky/src/sugar/Counter.luex -p tsconfig.json`
- Hide transformed code block output: add `--no-code`
- Machine-readable output: add `--json` (exit code remains `1` if diagnostics exist)

Linting
- allow get accessors to be defined with arrow functions or call expressions that return a function

