# NextScript Specification (Draft)

This document defines language-level behavior for selected NextScript extensions.

## 1. JSX Return Statements

### 1.1. Overview

A JSX return statement is a reserved JSX construct that denotes an implicit return of a language keyword element.

Syntax shape:

```tsx
<:keyword ...attrs>
	...children
</:keyword>
```

A JSX return statement is not a JSX native element and not a user component. It is a reserved language element form.

### 1.2. Purpose

JSX return statements provide explicit, balanced JSX syntax for language-level return constructs while preserving JSX-like readability.

### 1.3. Grammar (Normative)

Add the following production to the NextScript JSX grammar layer:

```ebnf
JSXReturnStatement :
	"<:" KeywordName JSXAttributes? ">" JSXChildren "</:" KeywordName ">"

KeywordName :
	Identifier
```

Constraints:

1. The opening and closing `KeywordName` must match exactly.
2. `:<name>` names belong to the reserved language-keyword set, not user JSX namespaces.
3. A JSX return statement is only valid in statement position inside a function-like body.

### 1.4. Reserved Keyword Set

The reserved keyword set is implementation-defined and extension-enabled.

The base language currently defines:

1. `component`

Implementations may allow framework plugins to register additional keyword names.

### 1.5. Static Errors (Normative)

A program is invalid if any of the following are true:

1. `:<name>` appears with `name` not present in the active keyword registry.
2. A JSX return statement appears outside statement position.
3. A JSX return statement appears outside a function-like body.
4. The opening and closing keyword names do not match.
5. A JSX return statement is used where a native element or user component is expected.

Recommended diagnostic category: syntax error.

### 1.6. Evaluation Model

Conceptually, a JSX return statement evaluates as an implicit return of its keyword element semantics.

For a function body:

```ts
{
	S1;
	S2;
	<:k attrs>children</:k>
}
```

the final statement is equivalent to:

```ts
{
	S1;
	S2;
	return evalKeyword(k, attrs, children)
}
```

where `evalKeyword` is defined by the keyword element specification.

### 1.7. Lowering Contract

A transpiler must lower each JSX return statement to explicit JavaScript/TypeScript return semantics and must not preserve `:<name>` syntax in emitted TSX/JSX.


## 2. JSX Component Element (`:component`)

### 2.1. Overview

The `:component` keyword element defines a typed component-kit return form.

Syntax:

```tsx
<:: as={componentExpr}>
	...children
</::>
```

The `as` attribute is optional.

### 2.2. Purpose

`:<component>` creates and returns a `ComponentKit<T>` value that carries:

1. a typed component instance surface (`component`), and
2. rendered nodes (`nodes`).

### 2.3. Types

```ts
interface ComponentKit<T = undefined> {
	component: T
	nodes: NSXNode[]
}
```

`NSXNode` is runtime-defined by the rendering target.

### 2.4. Static Rules (Normative)

1. `:<component>` must appear as a JSX return statement.
2. `:<component>` must be in statement position.
3. If provided, `as` must be a JSX expression container (`as={expr}`).
4. Duplicate `as` attributes are invalid.
5. Unknown attributes are implementation-defined; base spec recommends a static error for unknown attributes.

### 2.5. Semantics

Let `childrenFragment` be `<>children</>`.

1. Without `as`:

```tsx
<::>
	...children
</::>
```

denotes:

```ts
return JSXComponent(childrenFragment)
```

2. With `as={expr}`:

```tsx
<:: as={expr}>
	...children
</::>
```

denotes:

```ts
return JSXComponentAs(expr, childrenFragment)
```

### 2.6. Lowering (Normative)

A compliant transpiler must lower `:<component>` to one of the following forms:

1. `return JSXComponent(<>{children}</>)`
2. `return JSXComponentAs(asExpr, <>{children}</>)`

`JSXComponent` and `JSXComponentAs` may be imported or resolved by implementation-specific runtime wiring.

### 2.7. Examples

Source:

```tsx
function Dialog({ Slot }) {
	get opened = ion(false)
	const open = () => { opened = true }
	const close = () => { opened = false }

	<:: as={{ open, close }}>
		{If(opened,
			<o--body>
				<div>{Slot()}</div>
			</o--body>
		)}
	</::>
}
```

Lowered (illustrative):

```tsx
function Dialog({ Slot }) {
	const opened = assertA(ion(false))
	const open = () => { opened = true }
	const close = () => { opened = false }

	return JSXComponentAs({ open, close }, <>
		{If(opened,
			<o--body>
				<div>{Slot()}</div>
			</o--body>
		)}
	</>)
}
```


## 3. Extension and Registry Model

### 3.1. Keyword Registration

Implementations may expose a registration mechanism:

```ts
registerJSXReturnKeyword(name: string, lowering: LoweringRule)
```

Recommended constraints:

1. Name must be a valid identifier.
2. Name collisions are disallowed unless explicitly overridden by host policy.
3. Registration order must not produce ambiguous parse behavior.

### 3.2. Unknown Keyword Policy

Default policy should be fail-fast:

1. Unknown `:<name>` => compile-time error with nearest-known suggestion.


## 4. Notes for Tooling

1. Parser/highlighter support should treat `:<name>` and `</:name>` as paired reserved elements.
2. Language service diagnostics should point to keyword name tokens for unknown keyword errors.
3. Formatter should preserve balanced block shape and avoid rewriting into non-balanced shorthand.


## 5. Conformance Summary

A conforming implementation for this draft must:

1. Parse `:<name>` JSX return statements in statement position.
2. Reject invalid contexts via static errors.
3. Support `:<component>` semantics as specified.
4. Lower all JSX return statements to explicit return-oriented TS/JS semantics.
5. Preserve type intent of `ComponentKit<T>` at language-service level.
