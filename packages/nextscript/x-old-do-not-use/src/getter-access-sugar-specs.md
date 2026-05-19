Specs for extending tsx (as nsx) with syntactic sugar.

## Examples

Sugar:
```tsx
// example with syntactic sugar
function Counter({ showFractions@ }) {

   get count = ion(0, {
      increment() {
         count@.value++
      }
   })
   get doubleCount = ion((count * 2))

   const { halfCount@, thirdCount@ } = FractionKit(count@)

   get halfCountB = FractionKit(count@).halfCount@

   get obj = ion({name: 'kermit'} as {name: string} | undefined)

   function doSomethingElse() {
      if (obj) {
         console.log('name', obj.name)
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
import { πæ, destructureØ } from "@rue/nextscript";

function Counter({ æshowFractions }: FromTag<{ showFractions: Ion<boolean> }>) {
  const showFractions = æshowFractions

  const æcount = ion(0, {
    increment() {
      æcount.value++;
    },
  }), count = æcount;
  const ædoubleCount = ion(() => æcount() * 2), doubleCount = ædoubleCount;

  const { æhalfCount, æthirdCount } = destructureØ(FractionKit(æcount), 'æhalfCount', 'æthirdCount'), halfCount = æhalfCount, thirdCount = æthirdCount;

   const æobj = ion({ name: 'kermit' } as {name: string} | undefined), obj = æobj;

   function doSomethingElse() {
      if (æobj()) {
         console.log('name', æobj()!.name)
         watch(æobj, () => {
            console.log('nothing', æobj().name) // should throw: Object is possibly 'undefined'.ts(2532)
         })
      }
      else {
         console.log('nothing', æobj().name) // should throw: Object is possibly 'undefined'.ts(2532)
      }
   }

  return template(
    <div>
      <button on:click={(e) => æcount.increment()}>+</button>
      <p>start: {æcount()}</p>
      <p>count: {æcount}</p>
      <p>doubleCount: {ædoubleCount}</p>
      <p>tripleCount: {() => æcount() * 3}</p>
      <button>{() => æshowFractions() ? "hide" : "show"} fractions</button>
      {If(æshowFractions,
        <>
          <hr></hr>
          <p>halfCount: {() => æhalfCount() + '!'}</p>
          <p>thirdCount: {æthirdCount}</p>
        </>
      )}
    </div>
  );
}
```


Sugar:
```tsx
function CounterKit() {
   get count = ion(0)

   return {
      count@
      // comment
   }
}
```

Compiled:
```tsx
function CounterKit() {
  const æcount = ion(0), count = æcount;

  return {
      æcount,
      // comment
    };
}
```


Sugar:
```tsx
function CounterKit() {

   return {
      get count: ion(0)
   }
}
```

Compiled:
```tsx
function CounterKit() {
  return absorbØ({
      æcount: ion(0),
    }, ["æcount"]);
}
```


Sugar:
```tsx
function FractionKit(count@) {
   get halfCount = ion((count / 2))
   get thirdCount = ion((count / 3))

   return {
      halfCount@,
      thirdCount@,
      normalProperty: 0
   }
}
```

Compiled:
```tsx
function FractionKit(æcount) {
  const æhalfCount = ion(() => æcount() / 2), halfCount = æhalfCount;
  const æthirdCount = ion(() => æcount() / 3), thirdCount = æthirdCount;

   return {
      æhalfCount,
      æthirdCount,
      normalProperty: 0
   }
}
```


Sugar:
```tsx
function FractionKit(count@) {

   return {
      get halfCount: ion((count / 2)),
      get thirdCount: ion((count / 3)),
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
function FractionKit(æcount) {

   return absorbØ({
      æhalfCount: ion((æcount() / 2)),
      æthirdCount: ion((æcount() / 3)),
      πæsomething: function something() {
         return 4;
      },
      æcount,
      normalProperty: 0
   }, ['æhalfCount', 'æthirdCount', 'πæsomething', 'æcount', 'normalProperty'])
}
```


## Pre-ESLint/TSC transforms
### General notes
- use robust strategies for mapping positions from original source to transformed source.
- source-map/position-mapping guarantees:
   - diagnostics, hover, completions, go-to-definition, rename, and formatting ranges map back to authored sugar accurately.
   - syntax highlighting, formatting, linting, and Intellisense are efficient, performant, and responsive to authored source code changes
   - mappings remain stable after incremental edits (insert/delete lines above transformed regions).
- scope awareness: rewrites must be lexical-scope-aware and avoid touching shadowed identifiers in nested scopes.
   - example: if `count` is re-declared in an inner block/function, only references bound to the transformed `æcount` declaration should become `æcount()`.
- transform only in value-level code: never rewrite inside comments, string literals, template string text, import/export specifiers, type-only nodes, or property keys that are not identifier references.
- helper import policy:
   - helpers (`πæ`, `absorbØ`, `destructureØ`) are auto-imported only when used by transforms.
   - imports are deduped, stably ordered, and conflict-safe (if local symbols already exist, use deterministic aliasing strategy).
   - helper should be invisible to Intellisense and syntax highlighting
- transform idempotence: running the transform repeatedly on already transformed virtual source should not produce additional semantic changes.
- comment and formatting stability:
   - preserve comments around transformed nodes and maintain stable formatting to avoid editor/linter churn.
   - make sure all multi-line transforms are comment-safe (i.e. will not be broken by adding extra comment lines)

### Declaration and assignment transforms
* transform `get` declarations: `get variable = value` --> `const ævariable = value, variable = ævariable`
- transform `let` and `const` declarations of variables with `@` suffix: `const variable@ = value` --> `const ævariable = value`
- transform destructuring that contains at least one variable with the `@` suffix: `const { propertyA@, propertyB@, property } = obj` --> `const { æpropertyA, æpropertyB, property } = destructureØ(obj, 'æpropertyA', 'æpropertyB', 'property')`
* transform destructuring with `get` declaration:
   `get { propertyA, propertyB } = obj` --> `const { æpropertyA, æpropertyB } = destructureØ(obj, 'æpropertyA', 'æpropertyB'), propertyA = æpropertyA, propertyB = æpropertyB`
* transform object literals containing at least one 'invalid' `get` property declaration (`{ get property: value }`): 
`const obj = { get property: value }` --> `const obj = absorbØ({ æproperty: value, property: 'æ' }, ['æproperty'])`
   * with mixed property types:
      ```tsx
      function FractionKit(count@) {
         return {
            get halfCount: ion(() => count / 2),
            get thirdCount: ion(() => count / 3),
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
      function FractionKit(æcount) {
         return absorbØ({
            æhalfCount: ion(() => æcount() / 2),
            æthirdCount: ion(() => æcount() / 3),
            halfCount: 'æ',
            thirdCount: 'æ',
            πæsomething: function something() {
               return 4;
            },
            æcount,
            normalProperty: 0
         }, ['æhalfCount', 'æthirdCount', 'πæsomething', 'æcount', 'normalProperty'])
      }
      ```
   - import the getter absorber helper `absorbØ` from '@rue/nextscript' if it hasn't been imported yet.

### Access transforms
- transform all variables with the `@` suffix to `ævariable`: `variable@` --> `ævariable`
- transform all usages of `get`/`@`suffix variables without `@` suffix: `variable` --> `ævariable()`
   + transform when accessing a property from the `get`/`@`suffix variable: 
   `get obj = ion({ property: value }); obj.property` --> `const æobj = ion({ property: value }), obj = æobj; æobj().property`
   `const obj@ = ion({ property: value }); obj.property` --> `const æobj = ion({ property: value }); æobj().property`
- transform dot notation with `@` suffix:
  `get property = obj.property@` --> `const æproperty = (obj.æproperty, πæ(obj, 'property')), property = æproperty;`
  - import the getter access helper `πæ` from '@rue/nextscript' if it hasn't been imported yet
  - chained property access:
  `get property = obj.a.b.c.property@` --> `const æproperty = (obj.a.b.c.æproperty, πæ(obj.a.b.c, 'property')), property = æproperty`
  `get property = obj.a@.b@.c@.property@` --> `const æproperty = (obj.æa.æb.æc.æproperty, πæ(πæ(πæ(πæ(obj, 'a'), 'b'), 'c'), 'property')), property = æproperty`


### Derivation shorthand
- transform extraneous parentheses surrounding any of the following:
   - the value of a property or variable: `{ property: (value) }` --> `{ property: () => value }`, `const variable = (value)` --> `const variable = () => value`
   - an argument: `doSomething((argument))` --> `doSomething(() => argument)`
   - an item in an array literal: `[(item), (itemB)]` --> `[() => item, () => itemB]`
   * an expression within a JSX expression container: `<Comp value={(value + 1)}></Comp>` --> `<Comp value={() => value + 1}>`
   - when passed as an argument, assigned to a value or property, an item in an array literal, an expression within a JSX expression container:
      - the final expression of a sequence expression
      - the consequent or alternate of a conditional expression
      - the left and right of a logical expression
   + NOTE: extraneous parentheses means parentheses that are not used for grouping or for sequence expressions
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
+ Typescript should call out when the value of an `get` variable is possibly undefined when accessing via the transformed `ævariable()` and add a `!` after synchronous reads that are proven guarded.
+ Supported synchronous guard forms for `!` emission include:
   - `if (obj) { ...obj.name... }`
   - `if (!obj) { ... } else { ...obj.name... }`
   + `if (!obj) return; obj.name`
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
| Declarations | `get x = expr` | rewrites to `const æx = expr, x = æx`; diagnostics map to authored `x` | No |
| Declarations | `const x@ = expr` / `let x@ = expr` | rewrites to `const|let æx = expr` | No |
| Identifier usage | value-read of transformed binding | rewrites to call form (`æx()`) where applicable | No |
| Identifier usage | `x@` usage | rewrites to `æx` without adding extra calls | No |
| Destructuring | nested/alias/default/rest patterns | preserves runtime semantics and source order | No |
| Destructuring | mixed marked/unmarked bindings | rewrites only bindings covered by rules | No |
| Object literal `get` sugar | `{ get key: value }` | normalizes through `absorbØ(...)` | No |
| Object literal `get` sugar | mixed `get` sugar + getters + shorthand + plain props | preserves order and behavior | No |
| `@` property access | `obj.prop@` | rewrites to tuple form (`(obj.æprop, πæ(obj, 'prop'))`) | No |
| `@` property access | chained/optional/computed forms | preserves short-circuiting and evaluation order | No |
| Type guards | `if/else`, ternary, logical, explicit nullish comparisons | emits `æx()!` only in guarded synchronous branches | No |
| Type guards | `If()/ElseIf()/Else()` template branches | emits `æx()!` in guarded template branches; keeps unguarded reads diagnostic | No |
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
| TV-01 | `get count = ion(0)` | `const æcount = ion(0), count = æcount` | No |
| TV-02 | `const count@ = ion(0)` | `const æcount = ion(0)` | No |
| TV-03 | `let count@ = ion(0)` | `let æcount = ion(0)` | No |
| TV-04 | `get double = ion((count * 2))` | `const ædouble = ion(() => æcount() * 2)` | No |
| TV-05 | `const { a@, b, c@ } = src` | `const { æa, b, æc } = destructureØ(src, 'æa', 'b', 'æc')` | No |
| TV-06 | `get { a, b } = src` | `const { æa, æb } = destructureØ(src, 'æa', 'æb'), a = æa, b = æb` | No |
| TV-07 | `{ get value: ion(0) }` | `absorbØ({ ævalue: ion(0) }, ['ævalue'])` | No |
| **Access** |  |  |  |
| TV-08 | `get item = obj.prop@` | `const æitem = (obj.æprop, πæ(obj, 'prop'))` | No |
| TV-09 | `get item = obj.a@.b@.c@` | `const æitem = (obj.æa.æb.æc, πæ(πæ(πæ(obj, 'a'), 'b'), 'c'))` | No |
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
| TV-20 | `if (!obj) {} else { obj.name }` | else-branch read transforms with guarded assertion (`æobj()!.name`) | No |
| TV-21 | `!obj ? fallback : obj.name` | false-branch read transforms with guarded assertion (`æobj()!.name`) | No |
| TV-22 | `if (obj != null) { obj.name }` / `if (obj == null) {} else { obj.name }` | guarded branch read transforms with guarded assertion (`æobj()!.name`) | No |
| TV-25 | `while (obj) { obj.name }` / `do { obj.name } while (obj)` / `for (; obj; ) { obj.name }` | loop-body guarded reads transform with guarded assertion (`æobj()!.name`) | No |
| **Type Guards (Template Branches)** |  |  |  |
| TV-23 | `{If(obj, <p>{obj.name}</p>)} {ElseIf(obj !== undefined, <p>{obj.name}</p>)}` | guarded template-branch reads transform with guarded assertion | No |
| TV-24 | `{If(!obj, <p>missing</p>)} {Else(<p>{obj.name}</p>)}` | guarded `Else` template-branch read transforms with guarded assertion | No |
| **Type Guards (Render Functions)** |  |  |  |
| TV-26 | `{If(obj, () => <p>{obj.name}</p>)} {ElseIf(obj !== undefined, () => <p>{obj.name}</p>)}` | guarded render-function branch reads transform with guarded assertion | No |
| TV-27 | `{If(!obj, () => <p>missing</p>)} {Else(() => <p>{obj.name}</p>)}` | guarded `Else` render-function branch read transforms with guarded assertion | No |
| TV-28 | `IfElse(obj, () => obj.name, () => fallback)` | truthy render-function scope read transforms with guarded assertion | No |

### Implemented status (current)
- Transform assertions for type-guarded `!` emission are covered in `packages/nsx/src/__tests__/transform-rules.test.ts`.
- Diagnostic/remap behavior (guarded reads clean, unguarded reads still produce TS2532 at authored positions) is covered in `packages/nsx/src/__tests__/typecheck-diagnostics.test.ts`.
- Covered guard families include:
   - `if/else` truthy and negated conditions.
   - logical `&&` guarded reads.
   - conditional (`?:`) guarded branches, including negated and nested conditionals.
   - loop-guarded bodies (`while`, `do...while`, `for` condition).
   - explicit null/undefined comparisons (`==/!= null`, `===/!== undefined|null`).
   - template conditional helpers `If()/ElseIf()/Else()` in JSX templates.
   - synchronous render-function branch scopes for `If()/ElseIf()/Else()` and `IfElse()` truthy callbacks.
- `TV-25` traceability:
   - transform coverage: `adds non-null assertion inside while/do-while/for loop bodies guarded by condition` in `packages/nsx/src/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps loop-body reads clean for while/do-while/for guarded conditions while flagging later unguarded reads` in `packages/nsx/src/__tests__/typecheck-diagnostics.test.ts`.
- `TV-23` traceability:
   - transform coverage: `adds non-null assertion inside If and ElseIf template conditional branches` in `packages/nsx/src/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps If and ElseIf template branch reads clean while flagging later unguarded reads` in `packages/nsx/src/__tests__/typecheck-diagnostics.test.ts`.
- `TV-24` traceability:
   - transform coverage: `adds non-null assertion inside Else template branch when paired with negated If` in `packages/nsx/src/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps Else template branch reads clean when paired with negated If while flagging later unguarded reads` in `packages/nsx/src/__tests__/typecheck-diagnostics.test.ts`.
- `TV-26` traceability:
   - transform coverage: `adds non-null assertion inside If/ElseIf render-function branch scopes` in `packages/nsx/src/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps If/ElseIf render-function branch reads clean while flagging later unguarded reads` in `packages/nsx/src/__tests__/typecheck-diagnostics.test.ts`.
- `TV-27` traceability:
   - transform coverage: `adds non-null assertion inside Else render-function branch when paired with negated If` in `packages/nsx/src/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps Else render-function branch reads clean when paired with negated If while flagging later unguarded reads` in `packages/nsx/src/__tests__/typecheck-diagnostics.test.ts`.
- `TV-28` traceability:
   - transform coverage: `adds non-null assertion inside IfElse truthy render-function scope` in `packages/nsx/src/__tests__/transform-rules.test.ts`.
   - diagnostics/remap coverage: `keeps IfElse truthy render-function reads clean while flagging later unguarded reads` in `packages/nsx/src/__tests__/typecheck-diagnostics.test.ts`.
- Cross-cutting sugar regression coverage remains in `packages/nsx/src/__tests__/position-mapping.test.ts`, `packages/nsx/src/__tests__/remap-table-hover.test.ts`, and `packages/nsx/src/__tests__/tsserver-hover-integration.test.ts`.

### Known gaps / future vectors
- `||`-heavy compound conditions are intentionally conservative and may need dedicated branch-precision tests.
- Optional-chain-based boolean guards (`if (obj?.name)`) need explicit policy for whether object-level truthiness should imply safe `obj` member reads.
- Control-flow constructs beyond direct conditionals (e.g., `switch`-style narrowing, assertion-function-based narrowing) are not yet modeled for `æx()!` emission.
- Async boundaries remain conservative by design; add explicit vectors if future behavior should carry/restore narrowing across specific async patterns.

### Typechecking pipeline (`nsx-tsc`)

* `.nsx` files are virtualized as transformed `.tsx` for TypeScript typechecking.
- Authored sugar files are never rewritten on disk.
- Diagnostics are remapped from transformed virtual positions back to original sugar locations.
- Transformer single source of truth: `packages/nextscript/scripts/transform-nsx-sugar.shared.cjs`.
- NextScript entrypoint wrapper: `packages/nextscript/scripts/transform-nsx-sugar.mjs`.
- TS Server package export: `@rue/nextscript/tsserver` via `packages/nextscript/tsserver.cjs`.
- TS Server plugin wrapper: `plugins/tsserver-plugin-nextscript/transform-nsx-sugar.cjs`.
- To run from root: `pnpm typecheck:nsx`
- To run from package: `pnpm -F @rue/nextscript typecheck`
