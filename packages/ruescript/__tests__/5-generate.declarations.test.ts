import { describe, expect, it } from 'vitest'
import { parseRXS } from '../src/2-parse'
import { printTSX } from '../src/4-generate'

function parseProgram(code: string) {
   return parseRXS('declarations-test.tsx', code).program
}

describe('printTSX declaration visitors', () => {
   it('prints definite variable declarator with type annotation', () => {
      const program = parseProgram('let a!: Type')
      const output = printTSX(program).code
      expect(output).toBe('let a!: Type;')
   })

   it('prints variable declarator without initializer as valid code', () => {
      const program = parseProgram('let a')
      const output = printTSX(program).code
      expect(output).toBe('let a;')
   })

   it('prints typed variable declarator without duplicate type annotation', () => {
      const program = parseProgram('let a: number = 1')
      const output = printTSX(program).code
      expect(output).toBe('let a: number = 1;')
   })

   it('prints declare function without body and preserves statement boundary', () => {
      const program = parseProgram('declare function id<T>(x: T): T\nconst y = 2')
      const output = printTSX(program).code
      expect(output).toBe('declare function id<T>(x: T): T;\nconst y = 2;')
   })

   it('prints class declaration with multiple implements entries and type arguments', () => {
      const program = parseProgram('class C implements A<number>, B<string> {}')
      const output = printTSX(program).code
      expect(output).toBe('class C implements A<number>, B<string> {\n}\n')
   })

   it('prints class static blocks with block-style line breaks', () => {
      const program = parseProgram('class C { static { init() } }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\tstatic {\n\t\tinit();\n\t}\n}\n')
   })

   it('prints class property definitions', () => {
      const program = parseProgram('class C { value?: number = 1 }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\tvalue?: number = 1;\n}\n')
   })

   it('prints class accessor properties', () => {
      const program = parseProgram('class C { accessor value = 1 }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\taccessor value = 1;\n}\n')
   })

   it('prints async generator class methods', () => {
      const program = parseProgram('class C { async *items<T>(x: T): Promise<T> { return x } }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\tasync *items<T>(x: T): Promise<T> {\n\t\treturn x;\n\t}\n}\n')
   })

   it('prints method modifiers for class methods', () => {
      const program = parseProgram('class C extends B { public override run() {} }')
      const output = printTSX(program).code
      expect(output).toBe('class C extends B {\n\tpublic override run() {\n\t}\n}\n')
   })

   it('prints decorators on class members', () => {
      const program = parseProgram('class C { @sealed value = 1\n@logged method() {} }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\t@sealed\n\tvalue = 1;\n\t@logged\n\tmethod() {\n\t}\n}\n')
   })

   it('prints class member modifiers in stable order', () => {
      const program = parseProgram('class M { run() {} }\nclass P { value = 1 }\nclass A { accessor item = 2 }')

      const methodClass = program.body[0] as unknown as { body: { body: Array<Record<string, unknown>> } }
      const propClass = program.body[1] as unknown as { body: { body: Array<Record<string, unknown>> } }
      const accessorClass = program.body[2] as unknown as { body: { body: Array<Record<string, unknown>> } }

      const method = methodClass.body.body[0]
      const prop = propClass.body.body[0]
      const accessor = accessorClass.body.body[0]

      method.accessibility = 'public'
      method.static = true
      method.override = true

      prop.accessibility = 'protected'
      prop.static = true
      prop.readonly = true

      accessor.accessibility = 'private'
      accessor.static = true
      accessor.readonly = true

      const output = printTSX(program).code
      expect(output).toBe('class M {\n\tpublic static override run() {\n\t}\n}\nclass P {\n\tprotected static readonly value = 1;\n}\nclass A {\n\tprivate static readonly accessor item = 2;\n}\n')
   })

   it('prints getter and setter class methods', () => {
      const program = parseProgram('class C { get value() { return this._value } set value(next) { this._value = next } }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\tget value() {\n\t\treturn this._value;\n\t}\n\tset value(next) {\n\t\tthis._value = next;\n\t}\n}\n')
   })

   it('prints computed class members', () => {
      const program = parseProgram('class C { ["m"]() { return 1 } ["v"] = 2 }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\t["m"]() {\n\t\treturn 1;\n\t}\n\t["v"] = 2;\n}\n')
   })

   it('prints constructor class methods', () => {
      const program = parseProgram('class C { constructor(public id: number) { this.id = id } }')
      const output = printTSX(program).code
      expect(output).toBe('class C {\n\tconstructor(public id: number) {\n\t\tthis.id = id;\n\t}\n}\n')
   })

   it('prints bodyless methods in declare classes as declarations', () => {
      const program = parseProgram('declare class C { run(): void }')
      const output = printTSX(program).code
      expect(output).toBe('declare class C {\n\trun(): void;\n}\n')
   })

   it('prints abstract member modifiers and decorators', () => {
      const program = parseProgram('abstract class B { value: number = 0 } abstract class C extends B { @trace abstract protected run(): void; @trace abstract override value: number; @trace abstract override accessor item: number }')
      const output = printTSX(program).code
      expect(output).toBe('abstract class B {\n\tvalue: number = 0;\n}\nabstract class C extends B {\n\t@trace\n\tabstract protected run(): void;\n\t@trace\n\tabstract override value: number;\n\t@trace\n\tabstract override accessor item: number;\n}\n')
   })

   it('prints TS method signatures inline with sibling members', () => {
      const program = parseProgram('interface I { run(a: A): B; value: number }')
      const output = printTSX(program).code
      expect(output).toBe('interface I { run(a: A): B; value: number; }\n')
   })

   it('prints common TS type visitors for module, import type, and mapped type', () => {
      const program = parseProgram('declare module "x" { export type Box<T> = { [K in keyof T]?: T[K] }; export type Name = import("pkg").Type<string>; }')
      const output = printTSX(program).code
      expect(output).toBe('declare module "x" {\n\texport type Box<T> = { [K in keyof T]?: T[K] };\n\texport type Name = import("pkg").Type<string>;\n}\n\n')
   })
})
