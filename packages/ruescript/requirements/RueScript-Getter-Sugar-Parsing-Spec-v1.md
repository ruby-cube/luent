# RueScript Getter Sugar: Parsing and Disambiguation Spec (Proposal v1)

Status: Draft proposal for internal language design
Scope: Parsing behavior for `@` in getter sugar and derivation forms

## 1. Goals

This document defines unambiguous parsing rules for RueScript's `@` token where it is overloaded across:
- postfix accessor operator
- derivation expression marker
- absorption marker in binding positions

The purpose is to ensure parser, transform, and language-service behavior stay aligned.

## 2. Core Category: Access Target

### Definition

An Access Target is an expression form whose value is produced immediately at the current evaluation point and may be normalized to a getter by postfix `@`.

Allowed Access Target forms:
1. Identifier read: `x`
2. Property read: `obj.prop`
3. Element read: `obj[key]`
4. Call result: `fn()`
5. Constructor result: `new Foo()`

Not Access Targets for postfix accessor parsing:
1. Parenthesized expression used with `(expr)@` (reserved for derivation)
2. Block expression used with `{ ... }@` (reserved for derivation)
3. Declaration positions, except explicit absorption syntax in parameters and destructuring

## 3. Grammar (Normative)

```ebnf
PostfixAccessorExpression
  : AccessTarget '@'
  ;

DerivationExpression
  : '(' Expression ')' '@'
  | '{' StatementList ReturnStatement '}' '@'
  ;

ImmediateDerivationExpression
  : DerivationExpression '(' ')'
  ;

AccessTarget
  : IdentifierReference
  | MemberExpression '.' IdentifierName
  | MemberExpression '[' Expression ']'
  | CallExpression
  | NewExpression
  ;
```

Note: In implementation, `CallExpression` and `NewExpression` can already include member/call chains. The important constraint is that `(expr)@` and `{...}@` are reserved derivation forms.

## 4. Disambiguation Rules (Normative)

When `@` is encountered, apply the first matching rule:

1. If the immediately preceding syntactic form is `)` and it closes a parenthesized expression, parse as `DerivationExpression`.
2. If the immediately preceding syntactic form is `}` and it closes a block expression body, parse as `DerivationExpression`.
3. If in binding context for parameter declaration or destructuring target, parse `@` as absorption marker, not postfix accessor.
4. Otherwise, in expression context, parse trailing `@` as postfix accessor on the nearest `AccessTarget`.

## 5. Precedence and Associativity (Normative)

Relative precedence from tighter to looser:
1. Member access, element access, call, `new`
2. Postfix accessor `@`
3. Non-null assertion `!` (when applicable in TS-compatible parse layers)
4. Type assertion forms (`as`, angle-bracket assertion where enabled)
5. Binary operators
6. Conditional / assignment

Postfix `@` is left-associative over chained postfix parsing surfaces, but only one `@` may directly apply to a given immediate target unless nested by explicit syntax.

## 6. Optional Chaining + Accessor

To avoid parser and tooling ambiguity:
1. Allow: `obj?.prop@`
2. Allow: `obj?.[key]@`
3. Disallow: `obj?.@`

Normalization behavior when optional chain short-circuits:
- `obj?.prop@` evaluates to `undefined` if the chain short-circuits.
- Otherwise it evaluates to `Get<T>` for the accessed target type `T`.

So the result type is `undefined | Get<T>` for optional-chain accessor forms.

## 7. Transformation Semantics (Normative)

Given helper `toGetter(value)`:
- If `value` is already a getter, return it unchanged.
- Otherwise, return a stable getter wrapper that reads from the same live source.

Transform rules:
1. `x@` -> `toGetter(x)`
2. `obj.prop@` -> `getAccessor(obj, "prop")` (or equivalent preserving `this` semantics)
3. `obj[key]@` -> `getAccessor(obj, key)`
4. `fn()@` -> `toGetter(fn())`
5. `new Foo()@` -> `toGetter(new Foo())`
6. `(expr)@` -> `() => expr`
7. `{ ...; return expr }@` -> `() => { ...; return expr }`
8. `(expr)@()` -> `(() => expr)()`
9. `{ ...; return expr }@()` -> `(() => { ...; return expr })()`

## 8. Parse Matrix (Must Parse As)

1. `foo()@ as Get<number>`
- Parse: `(foo()@) as Get<number>`
- Not: `foo() @as ...`

2. `(foo() as number)@`
- Parse: derivation expression
- Emit: `() => (foo() as number)`

3. `new Foo()@`
- Parse: postfix accessor on constructor result
- Emit: `toGetter(new Foo())`

4. `(new Foo())@`
- Parse: derivation expression
- Emit: `() => new Foo()`

5. `a + b@`
- Parse: `a + (b@)`

6. `obj?.prop@`
- Parse: optional-chain accessor form
- Type: `undefined | Get<T>`

## 9. Invalid Forms (Must Error)

1. `const x@ = 0`
- Reason: postfix accessor is not valid in ordinary declaration identifiers

2. `obj?.@`
- Reason: no valid Access Target after optional chain token

3. `((a + b))@` if implementation treats any parenthesized form with trailing `@` as derivation
- Must emit derivation behavior, not postfix accessor, to keep rule consistency

## 10. Conformance Tests (Minimum Set)

Parser tests:
1. Distinguish `foo()@` from `(foo())@`
2. Distinguish `new Foo()@` from `(new Foo())@`
3. Enforce `obj?.@` rejection
4. Confirm binding-context absorption parse for parameter/destructuring

Transform tests:
1. Ensure accessor property wrappers preserve `this`
2. Ensure optional-chain accessor returns `undefined | Get<T>` behavior
3. Ensure derivation forms produce function wrappers exactly

Language-service tests:
1. Hover/type parity for each parse matrix row
2. Diagnostic parity for invalid forms
3. Mapping stability for transformed virtual code

## 11. Implementation Notes

- Keep one authoritative parse-mode decision point for `@` to avoid parser/LS drift.
- Apply the same disambiguation rules in parser, transformer, and language-service virtual-file generator.
- Add snapshot tests where source and generated code both include mapping assertions for each parse matrix case.

## 12. Destructuring Assignment Rewrite Rules

Define a write primitive:

```ts
WriteAccessor(x, v) := assertMutable(x).value = v
```

Core rule:
1. Evaluate RHS exactly once into a temporary.
2. Perform ordinary JS destructuring from that temporary into temporary values.
3. For each accessor target, route assignment through `WriteAccessor`.
4. For each non-accessor target, keep ordinary assignment semantics.
5. Preserve assignment expression result value (the original RHS value).

### Object pattern

Input:
```ts
({ a: count } = rhs)
```

Lowering:
```ts
const _r0 = rhs
const { a: _v0 } = _r0
WriteAccessor(count, _v0)
```

With default:
```ts
({ a: count = 30 } = rhs)
```

Lowering:
```ts
const _r0 = rhs
const { a: _v0 = 30 } = _r0
WriteAccessor(count, _v0)
```

Computed key:
```ts
({ [k()]: count } = rhs)
```

Lowering:
```ts
const _r0 = rhs
const _k0 = k()
const { [_k0]: _v0 } = _r0
WriteAccessor(count, _v0)
```

Rest:
```ts
({ a: normal, ...count } = rhs)
```

Lowering:
```ts
const _r0 = rhs
const { a: _n0, ..._v0 } = _r0
normal = _n0
WriteAccessor(count, _v0)
```

### Array pattern

Input:
```ts
([count] = rhs)
```

Lowering:
```ts
const _r0 = rhs
const [_v0] = _r0
WriteAccessor(count, _v0)
```

Elision, default, rest:
```ts
([, count = 5, ...restAcc] = rhs)
```

Lowering:
```ts
const _r0 = rhs
const [, _v0 = 5, ..._v1] = _r0
WriteAccessor(count, _v0)
WriteAccessor(restAcc, _v1)
```

### Nested patterns

Input:
```ts
({ a: { b: count = 1 } } = rhs)
```

Lowering:
```ts
const _r0 = rhs
const { a: { b: _v0 = 1 } } = _r0
WriteAccessor(count, _v0)
```

### Mixed normal and accessor targets

Input:
```ts
({ a: normal, b: count } = rhs)
```

Lowering:
```ts
const _r0 = rhs
const { a: _n0, b: _v0 } = _r0
normal = _n0
WriteAccessor(count, _v0)
```

### Expression-context form

When destructuring assignment appears in expression context, preserve JS result value:

```ts
value = (() => {
  const _r0 = rhs
  const { a: _v0 } = _r0
  WriteAccessor(count, _v0)
  return _r0
})()
```

### Safety constraints

1. Generate unique temporary names (`_r0`, `_v0`, `_k0`, etc.) per transform scope.
2. Never evaluate RHS or computed keys more than once.
3. Preserve JS default initializer timing and order by using native destructuring in temporary extraction.
4. Apply `WriteAccessor` only to accessor targets.
