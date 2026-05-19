import { describe, expect, it } from 'vitest'
import { parseNSX } from '../src/2-parse'
import { printTSX } from '../src/4-generate'

function parseProgram(code: string) {
   return parseNSX('expressions-test.tsx', code).program
}

function gen(code: string) {
   return printTSX(parseProgram(code)).code
}

function stripRawFromAllLiterals(input: unknown) {
   const stack: unknown[] = [input]
   while (stack.length > 0) {
      const current = stack.pop()
      if (!current || typeof current !== 'object') continue

      const node = current as Record<string, unknown>
      if (node.type === 'Literal' && 'raw' in node) {
         delete node.raw
      }

      for (const value of Object.values(node)) {
         if (Array.isArray(value)) {
            for (const item of value) stack.push(item)
         }
         else {
            stack.push(value)
         }
      }
   }
}

function stripRawFromAllJSXText(input: unknown) {
   const stack: unknown[] = [input]
   while (stack.length > 0) {
      const current = stack.pop()
      if (!current || typeof current !== 'object') continue

      const node = current as Record<string, unknown>
      if (node.type === 'JSXText' && 'raw' in node) {
         delete node.raw
      }

      for (const value of Object.values(node)) {
         if (Array.isArray(value)) {
            for (const item of value) stack.push(item)
         }
         else {
            stack.push(value)
         }
      }
   }
}

describe('printTSX expression visitors', () => {

   // #region: JSX

   it('prints JSX self-closing element with attributes', () => {
      expect(gen('const v = <Comp disabled />')).toBe('const v = <Comp disabled />;')
   })

   it('prints JSX fragment and spread child', () => {
      expect(gen('const v = <>{...items}</>')).toBe('const v = <>{...items}</>;')
   })

   it('prints JSX element with TS type arguments', () => {
      expect(gen('const v = <Comp<string> prop={value} />')).toBe('const v = <Comp<string> prop={value} />;')
   })

   it('prints JSX empty expression containers as valid placeholders', () => {
      expect(gen('const v = <div>{/* hello */}</div>')).toBe('const v = <div>{/* */}</div>;')
   })

   it('escapes JSXText fallback when raw is unavailable', () => {
      const program = parseProgram('const v = <div>& { x < y }</div>')
      stripRawFromAllJSXText(program)
      expect(printTSX(program).code).toBe('const v = <div>&amp; {x < y}</div>;')
   })

   // #endregion

   // #region: regression cases from formatting fixes

   it('preserves sparse array elisions with trailing holes', () => {
      expect(gen('const a = [,,]')).toBe('const a = [, ,];')
   })

   it('prints dense array without trailing comma', () => {
      expect(gen('const a = [1, 2, 3]')).toBe('const a = [1, 2, 3];')
   })

   it('preserves mid-array elision', () => {
      expect(gen('const a = [1,,3]')).toBe('const a = [1, , 3];')
   })

   it('prints empty object pattern without extra interior spaces', () => {
      expect(gen('const {} = obj')).toBe('const {} = obj;')
   })

   it('prints object pattern with properties with interior spaces', () => {
      expect(gen('const { a, b } = obj')).toBe('const { a, b } = obj;')
   })

   it('prints anonymous class expressions without double spaces', () => {
      const out = gen('const C = class {}')
      expect(out).toContain('class {')
      expect(out).not.toContain('class  {')
   })

   it('prints named class expression with single space after keyword', () => {
      expect(gen('const C = class Foo {}')).toContain('class Foo {')
   })

   // #endregion

   // #region: ParenthesizedExpression

   it('preserves parens in arithmetic precedence context', () => {
      expect(gen('const n = (a + b) * c')).toBe('const n = (a + b) * c;')
   })

   it('preserves parens grouping logical subexpression', () => {
      expect(gen('const x = (a || b) && c')).toBe('const x = (a || b) && c;')
   })

   it('preserves parens around conditional test', () => {
      expect(gen('const x = (a > b) ? 1 : 2')).toBe('const x = (a > b) ? 1 : 2;')
   })

   it('preserves parens around ts-as expression before member access', () => {
      expect(gen('const x = (value as Foo).bar')).toBe('const x = (value as Foo).bar;')
   })

   // #endregion

   // #region: ArrowFunctionExpression

   it('prints simple arrow function', () => {
      expect(gen('const f = (x) => x * 2')).toBe('const f = (x) => x * 2;')
   })

   it('prints async arrow function', () => {
      expect(gen('const f = async (x) => x')).toBe('const f = async (x) => x;')
   })

   it('prints arrow function with block body', () => {
      expect(gen('const f = () => { return 1 }')).toBe('const f = () => {\n\treturn 1;\n}\n;')
   })

   it('prints arrow function with no params', () => {
      expect(gen('const f = () => 0')).toBe('const f = () => 0;')
   })

   // #endregion

   // #region: CallExpression

   it('prints simple call expression', () => {
      expect(gen('foo(a, b)')).toBe('foo(a, b);\n')
   })

   it('prints optional call expression', () => {
      expect(gen('foo?.()')).toBe('foo?.();\n')
   })

   it('prints call with type arguments', () => {
      expect(gen('foo<string>(x)')).toBe('foo<string>(x);\n')
   })

   it('prints nested member call', () => {
      expect(gen('a.b.c()')).toBe('a.b.c();\n')
   })

   // #endregion

   // #region: MemberExpression

   it('prints dot member access', () => {
      expect(gen('const x = obj.value')).toBe('const x = obj.value;')
   })

   it('prints computed member access', () => {
      expect(gen('const x = obj[key]')).toBe('const x = obj[key];')
   })

   it('prints optional member access', () => {
      expect(gen('const x = obj?.value')).toBe('const x = obj?.value;')
   })

   it('prints optional computed member access', () => {
      expect(gen('const x = obj?.[key]')).toBe('const x = obj?.[key];')
   })

   // #endregion

   // #region: BinaryExpression / LogicalExpression / AssignmentExpression

   it('prints binary expression', () => {
      expect(gen('const x = a + b')).toBe('const x = a + b;')
   })

   it('prints logical expression', () => {
      expect(gen('const x = a && b')).toBe('const x = a && b;')
   })

   it('prints assignment expression', () => {
      expect(gen('a = b')).toBe('a = b;\n')
   })

   it('prints compound assignment', () => {
      expect(gen('a += 1')).toBe('a += 1;\n')
   })

   // #endregion

   // #region: UnaryExpression / UpdateExpression

   it('prints prefix ! unary', () => {
      expect(gen('!ok')).toBe('!ok;\n')
   })

   it('prints prefix typeof with space', () => {
      expect(gen('typeof x')).toBe('typeof x;\n')
   })

   it('prints prefix void with space', () => {
      expect(gen('void 0')).toBe('void 0;\n')
   })

   it('prints postfix ++', () => {
      expect(gen('i++')).toBe('i++;\n')
   })

   it('prints prefix --', () => {
      expect(gen('--i')).toBe('--i;\n')
   })

   // #endregion

   // #region: NewExpression

   it('prints new expression with no args', () => {
      expect(gen('new Foo()')).toBe('new Foo();\n')
   })

   it('prints new expression with args', () => {
      expect(gen('new Map([["a", 1]])')).toBe('new Map([["a", 1]]);\n')
   })

   // #endregion

   // #region: ObjectExpression

   it('prints empty object literal', () => {
      expect(gen('const o = {}')).toBe('const o = {};')
   })

   it('prints object with shorthand and regular properties', () => {
      expect(gen('const o = { a, b: 2 }')).toBe('const o = { a, b: 2 };')
   })

   it('prints object method properties using method syntax', () => {
      expect(gen('const o = { run() {} }')).toContain('{ run() {')
      expect(gen('const o = { run() {} }')).not.toContain('run:')
   })

   it('prints object getter and setter properties', () => {
      expect(gen('const o = { get value() { return x }, set value(v) { x = v } }')).toBe('const o = { get value() {\n\treturn x;\n},\nset value(v) {\n\tx = v;\n}\n };')
   })

   it('prints object computed properties', () => {
      expect(gen('const o = { [k]: value }')).toBe('const o = { [k]: value };')
   })

   it('prints object getter with return type annotation', () => {
      expect(gen('const o = { get value(): number { return x } }')).toBe('const o = { get value(): number {\n\treturn x;\n}\n };')
   })

   it('prints object pattern defaults without collapsing defaults', () => {
      expect(gen('const { a = 1 } = obj')).toBe('const { a = 1 } = obj;')
   })

   // #endregion

   // #region: AssignmentPattern / Identifier / RestElement / SpreadElement / Literal

   it('prints assignment pattern in function parameters', () => {
      expect(gen('function f(x = 10) {}')).toBe('function f(x = 10){\n}\n')
   })

   it('prints identifier optional marker and type annotation in parameter', () => {
      expect(gen('function f(value?: number) {}')).toBe('function f(value?: number){\n}\n')
   })

   it('prints rest element in parameter lists', () => {
      expect(gen('function f(...args) { return args }')).toBe('function f(...args){\n\treturn args;\n}\n')
   })

   it('prints spread element in call arguments', () => {
      expect(gen('fn(...args)')).toBe('fn(...args);\n')
   })

   it('falls back to number literal value when raw is missing', () => {
      const program = parseProgram('const n = 42')
      stripRawFromAllLiterals(program)
      expect(printTSX(program).code).toBe('const n = 42;')
   })

   it('falls back to string literal value when raw is missing', () => {
      const program = parseProgram('const s = "hello"')
      stripRawFromAllLiterals(program)
      expect(printTSX(program).code).toBe('const s = "hello";')
   })

   it('falls back to boolean and null literals when raw is missing', () => {
      const program = parseProgram('const b = true\nconst n = null')
      stripRawFromAllLiterals(program)
      expect(printTSX(program).code).toBe('const b = true;const n = null;')
   })

   it('falls back to regex literal when raw is missing', () => {
      const program = parseProgram('const r = /ab+/gi')
      stripRawFromAllLiterals(program)
      expect(printTSX(program).code).toBe('const r = /ab+/gi;')
   })

   it('falls back to bigint literal when raw is missing', () => {
      const program = parseProgram('const b = 1n')
      stripRawFromAllLiterals(program)
      expect(printTSX(program).code).toBe('const b = 1n;')
   })

   // #endregion

   // #region: TemplateLiteral

   it('prints plain template literal', () => {
      expect(gen('const s = `hello`')).toBe('const s = `hello`;')
   })

   it('prints template literal with interpolation', () => {
      expect(gen('const s = `sum: ${a + b}`')).toBe('const s = `sum: ${a + b}`;')
   })

   it('prints tagged template expression', () => {
      expect(gen('html`<div>${x}</div>`')).toBe('html`<div>${x}</div>`;\n')
   })

   // #endregion

   // #region: ConditionalExpression

   it('prints ternary expression', () => {
      expect(gen('const x = ok ? a : b')).toBe('const x = ok ? a : b;')
   })

   // #endregion

   // #region: SequenceExpression

   it('prints sequence expression with parens', () => {
      // SequenceExpression visitor emits its own (), so when the user writes (a(), b())
      // the AST is ParenthesizedExpression { SequenceExpression } → double-wrapped is correct
      expect(gen('(a(), b())')).toBe('((a(), b()));\n')
   })

   // #endregion

   // #region: AwaitExpression / YieldExpression

   it('prints await expression', () => {
      expect(gen('async function f() { await fetch(url) }')).toContain('await fetch(url)')
   })

   it('prints yield expression', () => {
      expect(gen('function* g() { yield 1 }')).toContain('yield 1')
   })

   it('prints yield delegate', () => {
      expect(gen('function* g() { yield* other() }')).toContain('yield* other()')
   })

   // #endregion

   // #region: FunctionExpression

   it('prints named function expression', () => {
      expect(gen('const f = function named() {}')).toContain('function named()')
   })

   it('prints anonymous function expression', () => {
      expect(gen('const f = function() {}')).toContain('function()')
   })

   it('prints async function expression', () => {
      expect(gen('const f = async function() {}')).toContain('async function()')
   })

   it('prints generator function expression', () => {
      expect(gen('const f = function*() {}')).toContain('function*()')
   })

   // #endregion

   // #region: ClassExpression

   it('prints class expression with superclass', () => {
      expect(gen('const C = class extends Base {}')).toContain('class extends Base')
   })

   it('prints named class expression', () => {
      expect(gen('const C = class MyClass {}')).toContain('class MyClass')
   })

   it('prints class expression with implements', () => {
      expect(gen('const C = class implements Foo {}')).toContain('implements Foo')
   })

   // #endregion
})
