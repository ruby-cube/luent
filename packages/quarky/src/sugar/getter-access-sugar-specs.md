Specs for extending ts and tsx (as qrk and qrx) with syntactic sugar.

## Examples

Sugar:
```tsx
// example with syntactic sugar
function Counter({ showFractions@ }) {

   get count = Ion(0, {
      increment() {
         count@.value++
      }
   })
   get doubleCount = Ion((count * 2))

   const { halfCount@, thirdCount@ } = FractionKit(count@)

   get halfCountB = FractionKit(count@).halfCount@

   get obj = Ion({name: 'kermit'} as {name: string} | undefined)

   function doSomethingElse() {
      if (obj) {
         console.log('name', obj.name) // should throw: Object is possibly 'undefined'.ts(2532)
         watch(obj@, () => {
            console.log('nothing', obj.name) // should throw: Object is possibly 'undefined'.ts(2532)
         })
      }
      else {
         console.log('nothing', obj.name) // should throw: Object is possibly 'undefined'.ts(2532)
      }
   }

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
import { ø, πø, destructureØ } from "@rue/quarky";

function Counter({ øshowFractions }: FromTag<{ showFractions: Ion<boolean> }>) {
  const øcount = Ion(0, {
    increment() {
      øcount.value++;
    },
  });
  const ødoubleCount = Ion(() => øcount() * 2);

  const { øhalfCount, øthirdCount } = destructureØ(FractionKit(øcount), 'øhalfCount', 'øthirdCount');

   const øobj = Ion({ name: 'kermit' } as {name: string} | undefined)

   function doSomethingElse() {
      if (øobj()) {
         console.log('name', øobj()!.name)
         watch(øobj, () => {
            console.log('nothing', øobj().name) // should throw: Object is possibly 'undefined'.ts(2532)
         })
      }
      else {
         console.log('nothing', øobj().name) // should throw: Object is possibly 'undefined'.ts(2532)
      }
   }

  return template(
    <div>
      <button on:click={(e) => øcount.increment()}>+</button>
      <p>start: {øcount()}</p>
      <p>count: {øcount}</p>
      <p>doubleCount: {ødoubleCount}</p>
      <p>tripleCount: {() => øcount() * 3}</p>
      <button>{() => øshowFractions() ? "hide" : "show"} fractions</button>
      {If(øshowFractions,
        <>
          <hr></hr>
          <p>halfCount: {() => øhalfCount() + '!'}</p>
          <p>thirdCount: {øthirdCount}</p>
        </>
      )}
    </div>
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

  return {
      øcount,
      // comment
    };
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
function FractionKit(øcount) {
  const øhalfCount = Ion(() => øcount() / 2);
  const øthirdCount = Ion(() => øcount() / 3);

   return {
      øhalfCount,
      øthirdCount,
      normalProperty: 0
   }
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
      },
      count@,
      normalProperty: 0
   }
}
```

Compiled:
```tsx
function FractionKit(øcount) {

   return absorbØ({
      øhalfCount: Ion((øcount() / 2)),
      øthirdCount: Ion((øcount() / 3)),
      πøsomething: function something() {
         return 4;
      },
      øcount,
      normalProperty: 0
   }, ['øhalfCount', 'øthirdCount', 'πøsomething', 'øcount', 'normalProperty'])
}
```


## Pre-ESLint/TSC transforms
### General notes
- use robust strategies for mapping positions from original source to transformed source. See position mapping (marked 'pm:') notes for additional notes.
- source-map/position-mapping guarantees:
   - diagnostics, hover, completions, go-to-definition, rename, and formatting ranges map back to authored sugar accurately.
   - syntax highlighting, formatting, linting, and Intellisense are efficient, performant, and responsive to authored source code changes
   - mappings remain stable after incremental edits (insert/delete lines above transformed regions).
- scope awareness: rewrites must be lexical-scope-aware and avoid touching shadowed identifiers in nested scopes.
   - example: if `count` is re-declared in an inner block/function, only references bound to the transformed `øcount` declaration should become `øcount()`.
- transform only in value-level code: never rewrite inside comments, string literals, template string text, import/export specifiers, type-only nodes, or property keys that are not identifier references.
- helper import policy:
   - helpers (`πø`, `absorbØ`, `destructureØ`, and `ø`) are auto-imported only when used by transforms.
   - imports are deduped, stably ordered, and conflict-safe (if local symbols already exist, use deterministic aliasing strategy).
   - helper should be invisible to Intellisense and syntax highlighting
- transform idempotence: running the transform repeatedly on already transformed virtual source should not produce additional semantic changes.
- comment and formatting stability:
   - preserve comments around transformed nodes and maintain stable formatting to avoid editor/linter churn.
   - make sure all multi-line transforms are comment-safe (i.e. will not be broken by adding extra comment lines)

### Declaration and assignment transforms
- transform `get` declarations: `get variable =` --> `const øvariable =`
   - pm: `get <span:v>variable</span:v> =` --> `const <span:v>øvariable</span:v> =`
- transform `let` and `const` declarations of variables with `@` suffix: `const variable@ =` --> `const øvariable =`
   - pm: `const <span:v>variable@</span:v> =` --> `const <span:v>øvariable</span:v> =`
- transform destructuring that contains at least one variable with the `@` suffix: `const { propertyA@, propertyB@, property } = obj` --> `const { øpropertyA, øpropertyB, property } = destructureØ(obj, 'øpropertyA', 'øpropertyB', 'property')`
   - pm: `const { <span:a>propertyA@</span:a>, <span:b>propertyB@</span:b>, <span:c>property</span:c> } = <span:o>obj</span:o>` --> `const { <span:a>øpropertyA</span:a>, <span:b>øpropertyB</span:b>, <span:c>property</span:c> } = destructureØ(<span:o>obj</span:o>, 'øpropertyA', 'øpropertyB', 'property')`
- transform destructuring with `get` declaration:
   `get { propertyA, propertyB } = obj` --> `const { øpropertyA, øpropertyB } = destructureØ(obj, 'øpropertyA', 'øpropertyB')`
   - pm: `get { <span:a>propertyA</span:a>, <span:b>propertyB</span:b> } = <span:o>obj</span:o>` --> `const { <span:a>øpropertyA</span:a>, <span:b>øpropertyB</span:b> } = destructureØ(<span:o>obj</span:o>, 'øpropertyA', 'øpropertyB')`
- transform object literals containing at least one 'invalid' `get` property declaration (`{ get property: value }`): 
`const obj = { get property: value }` --> `const obj = absorbØ({ øproperty: value }, ['øproperty'])`
   - with mixed property types:
      ```tsx
      function FractionKit(count@) {
         return {
            get halfCount: Ion(() => count / 2),
            get thirdCount: Ion(() => count / 3),
            get something() {
               return 4;
            },
            count@,
            normalProperty: 0
         }
      }
      ```
      -->
      ```tsx
      function FractionKit(øcount) {
         return absorbØ({
            øhalfCount: Ion(() => øcount() / 2),
            øthirdCount: Ion(() => øcount() / 3),
            πøsomething: function something() {
               return 4;
            },
            øcount,
            normalProperty: 0
         }, ['øhalfCount', 'øthirdCount', 'πøsomething', 'øcount', 'normalProperty'])
      }
      ```
      - pm: 
      ```tsx
      function FractionKit(<span:p>count@</span:p>) {
         return {
            get <span:a>halfCount</span:a>: Ion(() => count / 2),
            get <span:b>thirdCount</span:b>: Ion(() => count / 3),
            get <span:c>something() {
               return 4;
            }</span:c>,
            <span:d>count@</span:d>,
            normalProperty: 0
         }
      }
      ```
      -->
      ```tsx
      function FractionKit(<span:p>øcount</span:p>) {
         return absorbØ({
            <span:a>øhalfCount</span:a>: Ion(() => øcount() / 2),
            <span:b>øthirdCount</span:b>: Ion(() => øcount() / 3),
            πøsomething: <span:c>function something() {
               return 4;
            }</span:c>,
            <span:d>øcount</span:d>,
            normalProperty: 0
         }, ['øhalfCount', 'øthirdCount', 'πøsomething', 'øcount', 'normalProperty'])
      }
      ```
   - import the getter absorber helper `absorbØ` from '@rue/quarky' if it hasn't been imported yet.

### Access transforms
- transform all variables with the `@` suffix to `øvariable`: `variable@` --> `øvariable`
- transform all usages of `get`/`@`suffix variables without `@` suffix: `variable` --> `øvariable()`
   - pm: `<span:v>variable</span:v>` --> `<span:v>øvariable</span:v>()`
   + transform when accessing a property from the `get`/`@`suffix variable: 
   `get obj = Ion({ property: value }); obj.property` --> `const øobj = Ion({ property: value }); øobj().property`
   `const obj@ = Ion({ property: value }); obj.property` --> `const øobj = Ion({ property: value }); øobj().property`
- transform dot notation with `@` suffix:
  `get property = obj.property@` --> `const øproperty = (obj.øproperty, πø(obj, 'property'));`
  - pm: `get <span:p>property</span:p> = <span:o>obj</span:o>.<span:a>property@</span:a>` --> `const <span:p>øproperty</span:p> = (<span:a>obj.øproperty</span:a>, πø(<span:o>obj</span:o>, 'property'));`
  - import the getter access helper `πø` from '@rue/quarky' if it hasn't been imported yet
  - chained property access:
  `get property = obj.a.b.c.property@` --> `const øproperty = (obj.a.b.c.øproperty, πø(obj.a.b.c, 'property'))`
  `get property = obj.a@.b@.c@.property@` --> `const øproperty = (obj.øa.øb.øc.øproperty, πø(πø(πø(πø(obj, 'a'), 'b'), 'c'), 'property'))`
  - pm: `get <span:v>property</span:v> = <span:p>obj.a.b.c.property@</span:p>` --> `const <span:v>øproperty</span:v> = (<span:p>obj.a.b.c.property@</span:p>, πø(obj.a.b.c, 'property'))`
  - pm: `get <span:v>property</span:v> = <span:p>obj.a@.b@.c@.property@</span:p>` --> `const <span:v>øproperty</span:v> = (<span:p>obj.øa.øb.øc.øproperty</span:p>, πø(πø(πø(πø(obj, 'a'), 'b'), 'c'), 'property'))`

### JSX fragment shorthand
- transform jsx templates encased in extraneous parentheses (make sure transform is comment-safe):

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

### Derivation shorthand
- transform extraneous parentheses surrounding any of the following:
   - the value of a property or variable: `{ property: (value) }` --> `{ property: () => value }`, `const variable = (value)` --> `const variable = () => value`
      -pm: `{ property: <span:p>(</span:p><span:v>value</span:v>) }` --> `{ property: () <span:p>=></span:p> <span:v>value</span:v> }`
   - an argument: `doSomething((argument))` --> `doSomething(() => argument)`
   - an item in an array literal: `[(item), (itemB)]` --> `[() => item, () => itemB]`
   * an expression within a JSX expression container: `<Comp value={(value + 1)}></Comp>` --> `<Comp value={ø(() => value + 1)}>`
      + import the derivation helper, `ø`, from '@rue/quarky' if it is not already imported
   - when passed as an argument, assigned to a value or property, an item in an array literal, an expression within a JSX expression container:
      - the final expression of a sequence expression
      - the consequent or alternate of a conditional expression
      - the left and right of a logical expression
   - NOTE: browser DevTools pretty-print may visually show `fn( () => ...)`; verify raw transformed output (`?import`) for exact emitted spacing


### Edge cases and invariants
- destructuring coverage:
   - support nested patterns (`{ a: { b@ } }`, `[first@, ...rest]`), aliases (`{ source@: target }`-style equivalents), defaults, and rest elements.
   - preserve source order and defaults behavior exactly.
- `@` access with advanced syntax:
   - support optional chaining for dot-property access (`obj?.a@`).
   - computed property access with `@` is unsupported (`obj[key]@`, `obj?.[key]@`).
   - for chained `@` access, preserve short-circuit behavior and evaluation order.

### Type guards
+ Typescript should call out when the value of an `get` variable is possibly undefined when accessing via the transformed `øvariable()` and add a `!` after synchronous reads that are proven guarded.
+ Supported synchronous guard forms for `!` emission include:
   - `if (obj) { ...obj.name... }`
   - `if (!obj) { ... } else { ...obj.name... }`
   - `obj && obj.name`
   - `obj ? obj.name : fallback`
   - `!obj ? fallback : obj.name`
   - loop-guarded bodies:
      - `while (obj) { ...obj.name... }`
      - `do { ...obj.name... } while (obj)`
      - `for (; obj; ) { ...obj.name... }`
   - nested conditionals where the active branch implies `obj` is truthy
   - explicit nullish comparisons:
      - truthy branch of `obj != null`, `obj !== undefined`, `obj !== null`
      - false/else branch of `obj == null`, `obj === undefined`, `obj === null`
   - template conditional helpers in JSX templates:
      - `If(condition, branch)` / `ElseIf(condition, branch)` guarded branches
      - `Else(branch)` when prior `If`/`ElseIf` conditions imply truthiness in the else path (e.g. `If(!obj, ...)` + `Else(...)`)
      - render-function branch scopes are treated as synchronous guarded scopes when the branch condition implies truthiness:
         - `If(condition, () => ...)`, `ElseIf(condition, () => ...)`, `Else(() => ...)`
         - `IfElse(condition, whenTrue, whenFalse)` for `whenTrue` scope
+ Synchronous guard assertions do **not** flow into nested function/callback bodies (e.g. `watch(..., () => obj.name)`), so TypeScript can still report possible-undefined reads there.

### Conformance checklist
| Area | Example input | Expected transform behavior | Must diagnostic? |
|---|---|---|---|
| Declarations | `get x = expr` | rewrites to `const øx = expr`; diagnostics map to authored `x` | No |
| Declarations | `const x@ = expr` / `let x@ = expr` | rewrites to `const|let øx = expr` | No |
| Identifier usage | value-read of transformed binding | rewrites to call form (`øx()`) where applicable | No |
| Identifier usage | `x@` usage | rewrites to `øx` without adding extra calls | No |
| Destructuring | nested/alias/default/rest patterns | preserves runtime semantics and source order | No |
| Destructuring | mixed marked/unmarked bindings | rewrites only bindings covered by rules | No |
| Object literal `get` sugar | `{ get key: value }` | normalizes through `absorbØ(...)` | No |
| Object literal `get` sugar | mixed `get` sugar + getters + shorthand + plain props | preserves order and behavior | No |
| `@` property access | `obj.prop@` | rewrites to tuple form (`(obj.øprop, πø(obj, 'prop'))`) | No |
| `@` property access | chained/optional/computed forms | preserves short-circuiting and evaluation order | No |
| Type guards | `if/else`, ternary, logical, explicit nullish comparisons | emits `øx()!` only in guarded synchronous branches | No |
| Type guards | `If()/ElseIf()/Else()` template branches | emits `øx()!` in guarded template branches; keeps unguarded reads diagnostic | No |
| JSX shorthand | parenthesized multi-node JSX | rewrites to fragment shorthand; comments preserved | No |
| Derivation shorthand | allowed parenthesized value positions | rewrites only in allowed positions from spec | No |
| Imports/helpers | helper-required transforms | imports added only when needed; deduped; stably ordered; conflict-safe | No |
| Mapping/editor behavior | diagnostics/hover/completion/rename/goto/formatting | maps back to authored positions | No |
| Mapping/editor behavior | incremental edits above transformed regions | mapping remains stable | No |
| Safety/idempotence | comments/strings/type-only/import-export syntax | no rewrites in disallowed contexts | Yes (for unsupported) |
| Safety/idempotence | repeated transform pass | no additional semantic changes | No |

### Minimum test vectors
| ID | Input (sugar) | Expected output / behavior | Diagnostic? |
|---|---|---|---|
| **Declarations** |  |  |  |
| TV-01 | `get count = Ion(0)` | `const øcount = Ion(0)` | No |
| TV-02 | `const count@ = Ion(0)` | `const øcount = Ion(0)` | No |
| TV-03 | `let count@ = Ion(0)` | `let øcount = Ion(0)` | No |
| TV-04 | `get double = Ion((count * 2))` | `const ødouble = Ion(() => øcount() * 2)` | No |
| TV-05 | `const { a@, b, c@ } = src` | `const { øa, b, øc } = destructureØ(src, 'øa', 'b', 'øc')` | No |
| TV-06 | `get { a, b } = src` | `const { øa, øb } = destructureØ(src, 'øa', 'øb')` | No |
| TV-07 | `{ get value: Ion(0) }` | `absorbØ({ øvalue: Ion(0) }, ['øvalue'])` | No |
| **Access** |  |  |  |
| TV-08 | `get item = obj.prop@` | `const øitem = (obj.øprop, πø(obj, 'prop'))` | No |
| TV-09 | `get item = obj.a@.b@.c@` | `const øitem = (obj.øa.øb.øc, πø(πø(πø(obj, 'a'), 'b'), 'c'))` | No |
| TV-10 | `get item = obj?.a@` | preserves optional-chain short-circuit semantics in emitted access helper form | No |
| **JSX/Derivation** |  |  |  |
| TV-13 | `((<A></A><B></B>))` (multi-node JSX wrapped in parens) | fragment shorthand rewrite with comments preserved | No |
| TV-14 | `{ value: (a + 1) }` | `{ value: () => a + 1 }` | No |
| TV-15 | `doSomething((a + 1))` | `doSomething(() => a + 1)` | No |
| TV-16 | `[(a), (b)]` | `[() => a, () => b]` | No |
| TV-17 | `<Comp value={(a + 1)} />` | `<Comp value={() => a + 1} />` | No |
| **Safety** |  |  |  |
| TV-18 | `"count@" // get x = y` | no rewrites inside string/comment text | No |
| TV-19 | `import type { count@ } from 'x'` | no value-level rewrite inside type-only/import specifier contexts | Yes (if unsupported syntax) |
| **Type Guards (Control Flow)** |  |  |  |
| TV-20 | `if (!obj) {} else { obj.name }` | else-branch read transforms with guarded assertion (`øobj()!.name`) | No |
| TV-21 | `!obj ? fallback : obj.name` | false-branch read transforms with guarded assertion (`øobj()!.name`) | No |
| TV-22 | `if (obj != null) { obj.name }` / `if (obj == null) {} else { obj.name }` | guarded branch read transforms with guarded assertion (`øobj()!.name`) | No |
| TV-25 | `while (obj) { obj.name }` / `do { obj.name } while (obj)` / `for (; obj; ) { obj.name }` | loop-body guarded reads transform with guarded assertion (`øobj()!.name`) | No |
| **Type Guards (Template Branches)** |  |  |  |
| TV-23 | `{If(obj, <p>{obj.name}</p>)} {ElseIf(obj !== undefined, <p>{obj.name}</p>)}` | guarded template-branch reads transform with guarded assertion | No |
| TV-24 | `{If(!obj, <p>missing</p>)} {Else(<p>{obj.name}</p>)}` | guarded `Else` template-branch read transforms with guarded assertion | No |
| **Type Guards (Render Functions)** |  |  |  |
| TV-26 | `{If(obj, () => <p>{obj.name}</p>)} {ElseIf(obj !== undefined, () => <p>{obj.name}</p>)}` | guarded render-function branch reads transform with guarded assertion | No |
| TV-27 | `{If(!obj, () => <p>missing</p>)} {Else(() => <p>{obj.name}</p>)}` | guarded `Else` render-function branch read transforms with guarded assertion | No |
| TV-28 | `IfElse(obj, () => obj.name, () => fallback)` | truthy render-function scope read transforms with guarded assertion | No |

### Implemented status (current)
- Transform assertions for type-guarded `!` emission are covered in `packages/quarky/src/sugar/__tests__/transform-rules.test.ts`.
- Diagnostic/remap behavior (guarded reads clean, unguarded reads still produce TS2532 at authored positions) is covered in `packages/quarky/src/sugar/__tests__/typecheck-diagnostics.test.ts`.
- Covered guard families include:
   - `if/else` truthy and negated conditions.
   - logical `&&` guarded reads.
   - conditional (`?:`) guarded branches, including negated and nested conditionals.
   - loop-guarded bodies (`while`, `do...while`, `for` condition).
   - explicit null/undefined comparisons (`==/!= null`, `===/!== undefined|null`).
   - template conditional helpers `If()/ElseIf()/Else()` in JSX templates.
   - synchronous render-function branch scopes for `If()/ElseIf()/Else()` and `IfElse()` truthy callbacks.
- `TV-25` traceability:
   - transform coverage: `adds non-null assertion inside while/do-while/for loop bodies guarded by condition` in `packages/quarky/src/sugar/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps loop-body reads clean for while/do-while/for guarded conditions while flagging later unguarded reads` in `packages/quarky/src/sugar/__tests__/typecheck-diagnostics.test.ts`.
- `TV-23` traceability:
   - transform coverage: `adds non-null assertion inside If and ElseIf template conditional branches` in `packages/quarky/src/sugar/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps If and ElseIf template branch reads clean while flagging later unguarded reads` in `packages/quarky/src/sugar/__tests__/typecheck-diagnostics.test.ts`.
- `TV-24` traceability:
   - transform coverage: `adds non-null assertion inside Else template branch when paired with negated If` in `packages/quarky/src/sugar/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps Else template branch reads clean when paired with negated If while flagging later unguarded reads` in `packages/quarky/src/sugar/__tests__/typecheck-diagnostics.test.ts`.
- `TV-26` traceability:
   - transform coverage: `adds non-null assertion inside If/ElseIf render-function branch scopes` in `packages/quarky/src/sugar/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps If/ElseIf render-function branch reads clean while flagging later unguarded reads` in `packages/quarky/src/sugar/__tests__/typecheck-diagnostics.test.ts`.
- `TV-27` traceability:
   - transform coverage: `adds non-null assertion inside Else render-function branch when paired with negated If` in `packages/quarky/src/sugar/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps Else render-function branch reads clean when paired with negated If while flagging later unguarded reads` in `packages/quarky/src/sugar/__tests__/typecheck-diagnostics.test.ts`.
- `TV-28` traceability:
   - transform coverage: `adds non-null assertion inside IfElse truthy render-function scope` in `packages/quarky/src/sugar/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps IfElse truthy render-function reads clean while flagging later unguarded reads` in `packages/quarky/src/sugar/__tests__/typecheck-diagnostics.test.ts`.
- Cross-cutting sugar regression coverage remains in `packages/quarky/src/sugar/__tests__/position-mapping.test.ts`, `packages/quarky/src/sugar/__tests__/remap-table-hover.test.ts`, and `packages/quarky/src/sugar/__tests__/tsserver-hover-integration.test.ts`.

### Known gaps / future vectors
- `||`-heavy compound conditions are intentionally conservative and may need dedicated branch-precision tests.
- Optional-chain-based boolean guards (`if (obj?.name)`) need explicit policy for whether object-level truthiness should imply safe `obj` member reads.
- Control-flow constructs beyond direct conditionals (e.g., `switch`-style narrowing, assertion-function-based narrowing) are not yet modeled for `øx()!` emission.
- Async boundaries remain conservative by design; add explicit vectors if future behavior should carry/restore narrowing across specific async patterns.

### Typechecking pipeline (`quarky-tsc`)

* `.qrk` and `.qrx` files are virtualized as transformed `.ts`/`.tsx` for TypeScript typechecking.
- Authored sugar files are never rewritten on disk.
- Diagnostics are remapped from transformed virtual positions back to original sugar locations.
- Transformer single source of truth: `packages/quarky/scripts/transform-quarky-sugar.shared.cjs`.
- Quarky script entrypoint wrapper: `packages/quarky/scripts/transform-quarky-sugar.mjs`.
- TS Server plugin wrapper: `packages/quarky-tsserver-plugin/transform-quarky-sugar.cjs`.
- To run from root: `pnpm typecheck:quarky`
- To run from package: `pnpm -F @rue/quarky typecheck`
