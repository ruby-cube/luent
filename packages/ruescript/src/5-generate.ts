import type { ArrayExpression, AssignmentExpression, Node as ASTNode, BinaryExpression, ForInStatement, ForOfStatement, ForStatement, WhileStatement, LogicalExpression, PrivateInExpression, Program, ArrayPattern } from 'oxc-parser'
import { CodeMapping } from "@volar/language-core";
import { createStack } from '@rue/utils';
import { FunctionDeclaration } from 'typescript';

export type Segment = [number, number, number, number]

type Capabilities = CodeMapping['data']

export type IdentifierCapabilities = {
   completion: true,
   navigation: true,
   semantic: true,
   verification: true,
   format: false,
   structure: false
}

export type LiteralCapabilities = {
   completion: false,
   navigation: false,
   semantic: true,
   verification: false,
   format: false,
   structure: false
}


function hasCapabilities(node: ASTNode): node is ASTNode & { capabilities: Capabilities } {
   return 'capabilities' in node
}

function withCapabilities(node: ASTNode, start: number, end: number) {
   return hasCapabilities(node) // TODO: During transform, add capabilities for non-synthetic identifiers
      ? {
         start: node.start,
         end: node.end,
         capabilities: node.capabilities
      }
      : undefined
}

const TAB = '\t'


class InternalError extends Error { }

export function printTSX(program: Program): { code: string, map: CodeMapping[] } {

   const file = new CodePrinter({

      /**
       * expr;
       */
      ExpressionStatement(node, cursor) {
         cursor.indentScope()
         cursor.visit(node.expression)
         cursor.write(';\n')
      },

      /**
       * function id<T>(a: A, b: B = 0): Return { body }
       */
      FunctionDeclaration(node, cursor) {
         cursor.indentScope()
         if (node.declare) cursor.write('declare ')
         if (node.async) cursor.write('async ')
         cursor.write('function')
         node.generator ? cursor.write('* ') : cursor.write(' ')
         if (node.id) cursor.visit(node.id)
         if (node.typeParameters) cursor.visit(node.typeParameters)
         cursor.write('(')
         for (const param of node.params) {
            cursor.visit(param)
         }
         cursor.write(')')
         if (node.returnType) {
            cursor.visit(node.returnType)
         }
         if (node.body) cursor.visit(node.body)
         else cursor.write('{ }')
      },

      /**
       * <T, U extends string>
       */
      TSTypeParameterDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * x = 10
       */
      AssignmentPattern(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * { body }
       */
      BlockStatement(node, cursor) {
         cursor.write('{')
         cursor.enterScope()
         cursor.visitEach(node.body)
         cursor.exitScope()
         cursor.write('}\n')
      },

      /**
       * const a: A = 1,
       *    b: B = 2, 
       *    c: C = 3;
       */
      VariableDeclaration(node, cursor) {
         cursor.indentScope()
         if (node.declare) cursor.write('declare ')
         cursor.write(node.kind)
         cursor.write(' ')
         const declarations = node.declarations
         const limit = declarations.length
         for (let i = 0; i < limit; i++) {
            if (i > 0) {
               cursor.write(TAB)
            }
            cursor.visit(declarations[i], node)
            if (i === limit - 1) {
               cursor.write(';')
            }
            else {
               cursor.write(',')
            }
         }
      },

      /**
       * a!: Typed = 0
       */
      VariableDeclarator(node, cursor) {
         cursor.visit(node.id)
         if (node.definite) cursor.write('!')
         if (node.id.typeAnnotation) cursor.visit(node.id.typeAnnotation)
         cursor.write(' = ')
         if (!node.init) throw new SyntaxError('')
         cursor.visit(node.init)
      },

      /**
       * class Box<T> {}
       */
      ClassDeclaration(node, cursor) {
         cursor.indentScope()
         if (node.declare) cursor.write('declare ')
         if (node.abstract) cursor.write('abstract ')
         cursor.write('class ')
         if (node.id) cursor.visit(node.id)
         if (node.typeParameters) cursor.visit(node.typeParameters)
         if (node.superClass) {
            cursor.write(' extends ')
            cursor.visit(node.superClass)
            if (node.superTypeArguments) cursor.visit(node.superTypeArguments)
         }
         cursor.write(' ')
         cursor.visit(node.body)
      },

      /**
       * foo
       */
      Identifier(node, cursor) {
         cursor.write(node.name, withCapabilities(node, node.start, node.end))
         if (node.optional) cursor.write('?')
         if (node.typeAnnotation) cursor.visit(node.typeAnnotation)
      },

      /**
       * : string
       */
      TSTypeAnnotation(node, cursor) {
         cursor.write(': ')
         cursor.visit(node.typeAnnotation)
      },

      /**
       * Array<number>
       */
      TSTypeReference(node, cursor) {
         cursor.visit(node.typeName)
         if (node.typeArguments) {
            cursor.write('<')
            const args = node.typeArguments.params
            for (let i = 0; i < args.length; i++) {
               const arg = args[i]
               cursor.visit(arg)
               if (i < args.length - 1) {
                  cursor.write(', ')
               }
            }
            cursor.write('>')
         }
      },

      /**
       * expression as typeAnnotation
       */
      TSAsExpression(node, cursor) {
         cursor.visit(node.expression)
         cursor.write(' as ')
         cursor.visit(node.typeAnnotation)
      },

      /**
       * 42
       * "hello"
       * true
       */
      Literal(leaf, cursor) {
         if (leaf.raw) {
            cursor.write(leaf.raw, { // ONLY IF node has capabilities
               start: leaf.start,
               end: leaf.end,
               capabilities: { semantic: true }
            })
         }
      },

      /**
       * this.#count
       */
      PrivateIdentifier(leaf, cursor) {
         cursor.write(`#${leaf.name}`)
      },

      /**
       * this
       */
      ThisExpression(leaf, cursor) {
         cursor.write('this')
      },

      /**
       * super
       */
      Super(leaf, cursor) {
         cursor.write('super')
      },

      /**
       * new.target
       */
      MetaProperty(leaf, cursor) {
         cursor.visit(leaf.meta)
         cursor.write('.')
         cursor.visit(leaf.property)
      },

      /**
       * run<A, B>(a, b)
       * run?.()
       */
      CallExpression(node, cursor) {
         cursor.visit(node.callee)
         if (node.typeArguments) {
            cursor.visit(node.typeArguments)
         }
         node.optional
            ? cursor.write('?.(')
            : cursor.write('(')
         const args = node.arguments
         for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            cursor.visit(arg)
            if (i < args.length - 1) {
               cursor.write(', ')
            }
         }
         cursor.write(')')
      },

      /**
       * get value() { return 0 }
       */
      AccessorProperty(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * [a, b, c]
       */
      ArrayExpression: ArrayExpression,

      /**
       * [a, b] = arr
       */
      ArrayPattern(node, cursor) {
         ArrayExpression(node as ArrayPattern, cursor)
         if (node.typeAnnotation) cursor.visit(node.typeAnnotation)
      },

      /**
       * (x) => x * 2
       */
      ArrowFunctionExpression(node, cursor) {
         if (node.async) cursor.write('async ')
         if (node.typeParameters) cursor.visit(node.typeParameters)
         cursor.write('(')
         const params = node.params ?? []
         for (let i = 0; i < params.length; i++) {
            if (i > 0) cursor.write(', ')
            cursor.visit(params[i])
         }
         cursor.write(') => ')
         cursor.visit(node.body)
      },

      /**
       * a = b
       */
      AssignmentExpression: OperatorExpression,

      /**
       * a + b
       */
      BinaryExpression: OperatorExpression,

      /**
       * a && b
       */
      LogicalExpression: OperatorExpression,

      /**
       * await fetch(url)
       */
      AwaitExpression(node, cursor) {
         cursor.write('await ')
         cursor.visit(node.argument)
      },


      /**
       * break
       */
      BreakStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('break')
         if (node.label) {
            cursor.write(' ')
            cursor.visit(node.label)
         }
         cursor.write(';\n')
      },

      /**
       * catch (err) { handle(err) }
       */
      CatchClause(node, cursor) {
         cursor.write('catch')
         if (node.param) {
            cursor.write(' (')
            cursor.visit(node.param)
            cursor.write(')')
         }
         cursor.write(' ')
         cursor.visit(node.body)
      },

      /**
       * obj?.deep?.value
       */
      ChainExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * class C { method() {} }
       */
      ClassBody(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * const C = class {}
       */
      ClassExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * cond ? a : b
       */
      ConditionalExpression(node, cursor) {
         cursor.visit(node.test)
         cursor.write(' ? ')
         cursor.visit(node.consequent)
         cursor.write(' : ')
         cursor.visit(node.alternate)
      },

      /**
       * continue;
       */
      ContinueStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('continue')
         if (node.label) {
            cursor.write(' ')
            cursor.visit(node.label)
         }
         cursor.write(';\n')
      },

      /**
       * debugger;
       */
      DebuggerStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('debugger;\n')
      },

      /**
       * @sealed
       */
      Decorator(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * do { step() } while (ok)
       */
      DoWhileStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('do ')
         cursor.visit(node.body)
         cursor.write(' while (')
         cursor.visit(node.test)
         cursor.write(');\n')
      },

      /**
       * ;
       */
      EmptyStatement(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * export * from "./mod"
       */
      ExportAllDeclaration(node, cursor) {
         cursor.indentScope()
         cursor.write('export *')
         if (node.exported) {
            cursor.write(' as ')
            cursor.visit(node.exported)
         }
         if (node.source) {
            cursor.write(' from ')
            cursor.visit(node.source)
         }
         if (node.attributes && node.attributes.length > 0) {
            cursor.write(' with { ')
            for (let i = 0; i < node.attributes.length; i++) {
               if (i > 0) cursor.write(', ')
               cursor.visit(node.attributes[i])
            }
            cursor.write(' }')
         }
         cursor.write(';\n')
      },

      /**
       * export default value
       */
      ExportDefaultDeclaration(node, cursor) {
         cursor.indentScope()
         cursor.write('export default ')
         cursor.visit(node.declaration)
         if (node.declaration.type !== 'FunctionDeclaration' && node.declaration.type !== 'ClassDeclaration') {
            cursor.write(';')
         }
         cursor.write('\n')
      },

      /**
       * export { foo, bar as baz }
       */
      ExportNamedDeclaration(node, cursor) {
         cursor.indentScope()
         cursor.write('export ')
         if (node.declaration) {
            cursor.visit(node.declaration)
            return
         }

         cursor.write('{ ')
         const specifiers = node.specifiers ?? []
         for (let i = 0; i < specifiers.length; i++) {
            if (i > 0) cursor.write(', ')
            cursor.visit(specifiers[i])
         }
         cursor.write(' }')
         if (node.source) {
            cursor.write(' from ')
            cursor.visit(node.source)
         }
         if (node.attributes && node.attributes.length > 0) {
            cursor.write(' with { ')
            for (let i = 0; i < node.attributes.length; i++) {
               if (i > 0) cursor.write(', ')
               cursor.visit(node.attributes[i])
            }
            cursor.write(' }')
         }
         cursor.write(';\n')
      },

      /**
       * bar as baz
       */
      ExportSpecifier(node, cursor) {
         cursor.visit(node.local)
         if (node.exported) {
            cursor.write(' as ')
            cursor.visit(node.exported)
         }
      },

      /**
       * for (const k in obj) {}
       */
      ForInStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('for (')
         cursor.visit(node.left)
         cursor.write(' in ')
         cursor.visit(node.right)
         cursor.write(')')
         writeLoopBody(node, cursor)
      },

      /**
       * for (const v of list) {}
       */
      ForOfStatement(node, cursor) {
         cursor.indentScope()
         if (node.await) cursor.write('for await (')
         else cursor.write('for (')
         cursor.visit(node.left)
         cursor.write(' of ')
         cursor.visit(node.right)
         cursor.write(')')
         writeLoopBody(node, cursor)
      },

      /**
       * for (let i = 0; i < n; i++) {}
       */
      ForStatement(node, cursor) {
         const writeForInit = () => {
            const init = node.init
            if (!init) return
            if (init.type === 'VariableDeclaration') {
               if (init.declare) cursor.write('declare ')
               cursor.write(init.kind)
               cursor.write(' ')
               const declarations = init.declarations ?? []
               for (let i = 0; i < declarations.length; i++) {
                  if (i > 0) cursor.write(', ')
                  cursor.visit(declarations[i])
               }
               return
            }
            cursor.visit(init)
         }

         cursor.indentScope()
         cursor.write('for (')
         writeForInit()
         cursor.write('; ')
         if (node.test) cursor.visit(node.test)
         cursor.write('; ')
         if (node.update) cursor.visit(node.update)
         cursor.write(')')
         writeLoopBody(node, cursor)
      },

      /**
       * const fn = function () {}
       */
      FunctionExpression(node, cursor) {
         if (node.async) cursor.write('async ')
         cursor.write('function')
         if (node.generator) cursor.write('*')
         if (node.id) {
            cursor.write(' ')
            cursor.visit(node.id)
         }
         if (node.typeParameters) cursor.visit(node.typeParameters)
         cursor.write('(')
         const params = node.params ?? []
         for (let i = 0; i < params.length; i++) {
            if (i > 0) cursor.write(', ')
            cursor.visit(params[i])
         }
         cursor.write(')')
         if (node.returnType) cursor.visit(node.returnType)
         if (node.body) {
            cursor.write(' ')
            cursor.visit(node.body)
         }
         else {
            cursor.write(' { }')
         }
      },

      /**
       * #!/usr/bin/env node
       */
      Hashbang(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * if (ok) { run() } else { stop() }
       */
      IfStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('if (')
         cursor.visit(node.test)
         cursor.write(')')

         if (node.consequent.type === 'BlockStatement') {
            cursor.write(' ')
            cursor.visit(node.consequent)
         }
         else {
            cursor.write('\n')
            cursor.enterScope()
            cursor.visit(node.consequent)
            cursor.exitScope()
         }

         if (node.alternate) {
            if (node.consequent.type === 'BlockStatement') {
               cursor.write(' else')
            }
            else {
               cursor.indentScope()
               cursor.write('else')
            }

            if (node.alternate.type === 'BlockStatement' || node.alternate.type === 'IfStatement') {
               cursor.write(' ')
               cursor.visit(node.alternate)
            }
            else {
               cursor.write('\n')
               cursor.enterScope()
               cursor.visit(node.alternate)
               cursor.exitScope()
            }
         }
      },

      /**
       * with { type: "json" }
       */
      ImportAttribute(node, cursor) {
         cursor.visit(node.key)
         cursor.write(': ')
         cursor.visit(node.value)
      },

      /**
       * import { x } from "pkg"
       */
      ImportDeclaration(node, cursor) {
         cursor.indentScope()
         cursor.write('import ')

         const specifiers = node.specifiers ?? []
         const defaultSpecifier = specifiers.find((s) => s.type === 'ImportDefaultSpecifier')
         const namespaceSpecifier = specifiers.find((s) => s.type === 'ImportNamespaceSpecifier')
         const namedSpecifiers = specifiers.filter((s) => s.type === 'ImportSpecifier')

         let wroteSpecifier = false
         if (defaultSpecifier) {
            cursor.visit(defaultSpecifier)
            wroteSpecifier = true
         }
         if (namespaceSpecifier) {
            if (wroteSpecifier) cursor.write(', ')
            cursor.visit(namespaceSpecifier)
            wroteSpecifier = true
         }
         if (namedSpecifiers.length > 0) {
            if (wroteSpecifier) cursor.write(', ')
            cursor.write('{ ')
            for (let i = 0; i < namedSpecifiers.length; i++) {
               if (i > 0) cursor.write(', ')
               cursor.visit(namedSpecifiers[i])
            }
            cursor.write(' }')
            wroteSpecifier = true
         }

         if (!wroteSpecifier) {
            cursor.visit(node.source)
            cursor.write(';\n')
            return
         }

         cursor.write(' from ')
         cursor.visit(node.source)
         if (node.attributes && node.attributes.length > 0) {
            cursor.write(' with { ')
            for (let i = 0; i < node.attributes.length; i++) {
               if (i > 0) cursor.write(', ')
               cursor.visit(node.attributes[i])
            }
            cursor.write(' }')
         }
         cursor.write(';\n')
      },

      /**
       * React
       */
      ImportDefaultSpecifier(node, cursor) {
         cursor.visit(node.local)
      },

      /**
       * import("pkg")
       */
      ImportExpression(node, cursor) {
         cursor.write('import(')
         cursor.visit(node.source)
         if (node.options) {
            cursor.write(', ')
            cursor.visit(node.options)
         }
         cursor.write(')')
      },

      /**
       * * as ns
       */
      ImportNamespaceSpecifier(node, cursor) {
         cursor.write('* as ')
         cursor.visit(node.local)
      },

      /**
       * foo as bar
       */
      ImportSpecifier(node, cursor) {
         cursor.visit(node.imported)
         if (node.local) {
            cursor.write(' as ')
            cursor.visit(node.local)
         }
      },

      /**
       * <Comp disabled />
       */
      JSXAttribute(node, cursor) {
         cursor.visit(node.name)
         if (node.value) {
            cursor.write('=')
            cursor.visit(node.value)
         }
      },

      /**
       * </Comp>
       */
      JSXClosingElement(node, cursor) {
         cursor.write('</')
         cursor.visit(node.name)
         cursor.write('>')
      },

      /**
       * </>
       */
      JSXClosingFragment(node, cursor) {
         cursor.write('</>')
      },

      /**
       * <Comp prop={value} />
       */
      JSXElement(node, cursor) {
         cursor.visit(node.openingElement)
         const children = node.children ?? []
         for (let i = 0; i < children.length; i++) {
            cursor.visit(children[i])
         }
         if (node.closingElement) cursor.visit(node.closingElement)
      },



      /**
       * {value}
       */
      JSXExpressionContainer(node, cursor) {
         cursor.write('{')
         if (node.expression.type !== 'JSXEmptyExpression') {
            cursor.visit(node.expression)
         }
         cursor.write('}')
      },

      /**
       * <><Item /></>
       */
      JSXFragment(node, cursor) {
         cursor.visit(node.openingFragment)
         const children = node.children ?? []
         for (let i = 0; i < children.length; i++) {
            cursor.visit(children[i])
         }
         cursor.visit(node.closingFragment)
      },

      /**
       * Comp
       */
      JSXIdentifier(node, cursor) {
         cursor.write(node.name)
      },

      /**
       * UI.Button
       */
      JSXMemberExpression(node, cursor) {
         cursor.visit(node.object)
         cursor.write('.')
         cursor.visit(node.property)
      },

      /**
       * svg:path
       */
      JSXNamespacedName(node, cursor) {
         cursor.visit(node.namespace)
         cursor.write(':')
         cursor.visit(node.name)
      },

      /**
       * <Comp>
       */
      JSXOpeningElement(node, cursor) {
         cursor.write('<')
         cursor.visit(node.name)
         if (node.typeArguments) cursor.visit(node.typeArguments)
         const attributes = node.attributes ?? []
         for (let i = 0; i < attributes.length; i++) {
            cursor.write(' ')
            cursor.visit(attributes[i])
         }
         if (node.selfClosing) cursor.write(' />')
         else cursor.write('>')
      },

      /**
       * <>
       */
      JSXOpeningFragment(node, cursor) {
         cursor.write('<>')
      },

      /**
       * <Comp {...props} />
       */
      JSXSpreadAttribute(node, cursor) {
         cursor.write('{...')
         cursor.visit(node.argument)
         cursor.write('}')
      },

      /**
       * {...items}
       */
      JSXSpreadChild(node, cursor) {
         cursor.write('{...')
         cursor.visit(node.expression)
         cursor.write('}')
      },

      /**
       * hello
       */
      JSXText(node, cursor) {
         cursor.write(node.raw ?? node.value)
      },

      /**
       * loop: for (;;) { break loop }
       */
      LabeledStatement(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * obj?.value
       * obj[value]
       * obj?.[value]
       */
      MemberExpression(node, cursor) {
         cursor.visit(node.object)
         if (node.optional) cursor.write('?.')
         if (node.computed) cursor.write('[')
         else if (!node.optional) cursor.write('.')

         cursor.visit(node.property)
         if (node.computed) cursor.write(']')
      },

      /**
       * class C { m() {} }
       */
      MethodDefinition(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * new Date()
       */
      NewExpression(node, cursor) {
         cursor.write('new ')
         cursor.visit(node.callee)
         cursor.write('(')
         const args = node.arguments ?? []
         for (let i = 0; i < args.length; i++) {
            if (i > 0) cursor.write(', ')
            cursor.visit(args[i])
         }
         cursor.write(')')
      },

      /**
       * { a: 1, b }
       */
      ObjectExpression(node, cursor) {
         cursor.write('{')
         const properties = node.properties ?? []
         if (properties.length > 0) cursor.write(' ')
         for (let i = 0; i < properties.length; i++) {
            if (i > 0) cursor.write(', ')
            cursor.visit(properties[i])
         }
         if (properties.length > 0) cursor.write(' ')
         cursor.write('}')
      },

      /**
       * { a, b: c } = obj
       */
      ObjectPattern(node, cursor) {
         cursor.write('{ ')
         const properties = node.properties ?? []
         for (let i = 0; i < properties.length; i++) {
            if (i > 0) cursor.write(', ')
            cursor.visit(properties[i])
         }
         cursor.write(' }')
      },

      /**
       * (a + b)
       */
      ParenthesizedExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * const answer = 42
       */
      Program(node, cursor) {
         cursor.visitEach(node.body)
      },

      /**
       * { key: value }
       * { [key]: value }
       */
      Property(node, cursor) {
         const writeKey = () => {
            if (node.computed) {
               cursor.write('[')
               cursor.visit(node.key)
               cursor.write(']')
            }
            else {
               cursor.visit(node.key)
            }
         }

         if (node.kind === 'init') {
            writeKey()
            if (!(node.shorthand && !node.computed)) {
               cursor.write(': ')
               cursor.visit(node.value)
            }
            return
         }

         if (node.kind === 'get' || node.kind === 'set') {
            const value = node.value as unknown as { params?: ASTNode[], body?: ASTNode }
            cursor.write(`${node.kind} `)
            writeKey()
            cursor.write('(')
            const params = value.params ?? []
            for (let i = 0; i < params.length; i++) {
               if (i > 0) cursor.write(', ')
               cursor.visit(params[i])
            }
            cursor.write(') ')
            if (value.body) cursor.visit(value.body)
            else cursor.write('{ }')
            return
         }

         writeKey()
         cursor.write(': ')
         cursor.visit(node.value)
      },

      /**
       * class C { value = 1 }
       */
      PropertyDefinition(node, cursor) {
         cursor.indentScope()
         if (node.static) cursor.write('static ')
         if (node.declare) cursor.write('declare ')
         if (node.override) cursor.write('override ')
         if (node.readonly) cursor.write('readonly ')
         if (node.accessibility) cursor.write(`${node.accessibility} `)

         if (node.computed) {
            cursor.write('[')
            cursor.visit(node.key)
            cursor.write(']')
         }
         else {
            cursor.visit(node.key)
         }

         if (node.optional) cursor.write('?')
         if (node.definite) cursor.write('!')
         if (node.typeAnnotation) cursor.visit(node.typeAnnotation)
         if (node.value) {
            cursor.write(' = ')
            cursor.visit(node.value)
         }
         cursor.write(';\n')
      },

      /**
       * ...rest
       */
      RestElement(node, cursor) {
         cursor.write('...')
         cursor.visit(node.argument)
      },

      /**
       * return value
       */
      ReturnStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('return')
         if (node.argument) {
            cursor.write(' ')
            cursor.visit(node.argument)
         }
         cursor.write(';\n')
      },

      /**
       * (a(), b(), c())
       */
      SequenceExpression(node, cursor) {
         cursor.write('(')
         const expressions = node.expressions ?? []
         for (let i = 0; i < expressions.length; i++) {
            if (i > 0) cursor.write(', ')
            cursor.visit(expressions[i])
         }
         cursor.write(')')
      },

      /**
       * fn(...args)
       */
      SpreadElement(node, cursor) {
         cursor.write('...')
         cursor.visit(node.argument)
      },

      /**
       * class C { static { init() } }
       */
      StaticBlock(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * case 1: break
       */
      SwitchCase(node, cursor) {
         cursor.indentScope()
         if (node.test) {
            cursor.write('case ')
            cursor.visit(node.test)
            cursor.write(':\n')
         }
         else {
            cursor.write('default:\n')
         }

         cursor.enterScope()
         cursor.visitEach(node.consequent)
         cursor.exitScope()
      },

      /**
       * switch (x) { case 1: break }
       */
      SwitchStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('switch (')
         cursor.visit(node.discriminant)
         cursor.write(') {\n')
         cursor.enterScope()
         cursor.visitEach(node.cases)
         cursor.exitScope()
         cursor.indentScope()
         cursor.write('}')
      },

      /**
       * tag`hello ${name}`
       */
      TaggedTemplateExpression(node, cursor) {
         cursor.visit(node.tag)
         cursor.visit(node.quasi)
      },

      /**
       * `hello ${name}`
       */
      TemplateElement(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * `sum: ${a + b}`
       */
      TemplateLiteral(node, cursor) {
         cursor.write('`')
         const quasis = node.quasis ?? []
         const expressions = node.expressions ?? []
         for (let i = 0; i < quasis.length; i++) {
            const quasi = quasis[i] as unknown as { value?: { raw?: string }, raw?: string }
            const raw = quasi.value?.raw ?? quasi.raw ?? ''
            cursor.write(raw)
            if (i < expressions.length) {
               cursor.write('${')
               cursor.visit(expressions[i])
               cursor.write('}')
            }
         }
         cursor.write('`')
      },

      /**
       * throw new Error("boom")
       */
      ThrowStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('throw ')
         cursor.visit(node.argument)
         cursor.write(';\n')
      },

      /**
       * try { run() } catch (e) {}
       */
      TryStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('try ')
         cursor.visit(node.block)
         if (node.handler) {
            cursor.write(' ')
            cursor.visit(node.handler)
         }
         if (node.finalizer) {
            cursor.write(' finally ')
            cursor.visit(node.finalizer)
         }
      },

      /**
       * !ok
       */
      UnaryExpression(node, cursor) {
         if (node.prefix) {
            cursor.write(node.operator)
            if (/^[a-z]/.test(node.operator)) cursor.write(' ')
            cursor.visit(node.argument)
         }
         else {
            cursor.visit(node.argument)
            cursor.write(node.operator)
         }
      },

      /**
       * count++
       */
      UpdateExpression(node, cursor) {
         if (node.prefix) {
            cursor.write(node.operator)
            cursor.visit(node.argument)
         }
         else {
            cursor.visit(node.argument)
            cursor.write(node.operator)
         }
      },

      /**
       * %DebugPrint(value)
       */
      V8IntrinsicExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * while (cond) { tick() }
       */
      WhileStatement(node, cursor) {
         cursor.indentScope()
         cursor.write('while (')
         cursor.visit(node.test)
         cursor.write(')')
         writeLoopBody(node, cursor)
      },

      /**
       * with (obj) { x = 1 }
       */
      WithStatement(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * yield value
       */
      YieldExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * any
       */
      TSAnyKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * bigint
       */
      TSBigIntKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * boolean
       */
      TSBooleanKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * intrinsic
       */
      TSIntrinsicKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * ?
       */
      TSJSDocUnknownType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * never
       */
      TSNeverKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * null
       */
      TSNullKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * number
       */
      TSNumberKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * object
       */
      TSObjectKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * string
       */
      TSStringKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * symbol
       */
      TSSymbolKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * this
       */
      TSThisType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * undefined
       */
      TSUndefinedKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * unknown
       */
      TSUnknownKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * void
       */
      TSVoidKeyword(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * abstract accessor value: number
       */
      TSAbstractAccessorProperty(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * abstract run(): void
       */
      TSAbstractMethodDefinition(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * abstract value: number
       */
      TSAbstractPropertyDefinition(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * string[]
       */
      TSArrayType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * (a: A) => B
       */
      TSCallSignatureDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * implements Serializable
       */
      TSClassImplements(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * T extends U ? X : Y
       */
      TSConditionalType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * new (a: A) => B
       */
      TSConstructSignatureDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * new () => Date
       */
      TSConstructorType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * declare function id<T>(x: T): T
       */
      TSDeclareFunction(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * declare function fn(a: A): B
       */
      TSEmptyBodyFunctionExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * enum E { A, B }
       */
      TSEnumBody(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * enum E { A, B }
       */
      TSEnumDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * A = 1
       */
      TSEnumMember(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * export = value
       */
      TSExportAssignment(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * require("fs")
       */
      TSExternalModuleReference(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * (a: A) => B
       */
      TSFunctionType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * import fs = require("fs")
       */
      TSImportEqualsDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * import("pkg").Type
       */
      TSImportType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * [k: string]: number
       */
      TSIndexSignature(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * User["id"]
       */
      TSIndexedAccessType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * infer U
       */
      TSInferType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * fn<number>(1)
       */
      TSInstantiationExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * interface A { x: number }
       */
      TSInterfaceBody(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * interface A { x: number }
       */
      TSInterfaceDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * extends Base
       */
      TSInterfaceHeritage(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * A & B
       */
      TSIntersectionType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * !string
       */
      TSJSDocNonNullableType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * ?string
       */
      TSJSDocNullableType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * "on"
       */
      TSLiteralType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * { [K in Keys]: T[K] }
       */
      TSMappedType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * run(a: A): B
       */
      TSMethodSignature(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * declare module "x" { export const y: number }
       */
      TSModuleBlock(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * declare module "x" {}
       */
      TSModuleDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * name: string
       */
      TSNamedTupleMember(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * export as namespace Lib
       */
      TSNamespaceExportDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * value!
       */
      TSNonNullExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * T?
       */
      TSOptionalType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * constructor(public id: number) {}
       */
      TSParameterProperty(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * (A | B)
       */
      TSParenthesizedType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * id?: number
       */
      TSPropertySignature(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * ns.Type
       */
      TSQualifiedName(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * ...T[]
       */
      TSRestType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * value satisfies Schema
       */
      TSSatisfiesExpression(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * `id-${number}`
       */
      TSTemplateLiteralType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * [number, string]
       */
      TSTupleType(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * type ID = string | number
       */
      TSTypeAliasDeclaration(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * <Foo>value
       */
      TSTypeAssertion(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * { a: string; b?: number }
       */
      TSTypeLiteral(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * keyof T
       */
      TSTypeOperator(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * T extends Base = Default
       */
      TSTypeParameter(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * <string, number>
       */
      TSTypeParameterInstantiation(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * x is Foo
       */
      TSTypePredicate(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * typeof value
       */
      TSTypeQuery(node, cursor) {
         cursor.visitFallback(node)
      },

      /**
       * A | B | C
       */
      TSUnionType(node, cursor) {
         const types = node.types ?? []
         for (let i = 0; i < types.length; i++) {
            if (i > 0) cursor.write(' | ')
            cursor.visit(types[i])
         }
      }
   })

   file.visit(program)

   return {
      code: file.code,
      map: file.map
   }
}

function ArrayExpression(node: ArrayExpression | ArrayPattern, cursor: CodePrinter) {
   cursor.write('[')
   const elements = node.elements ?? []
   for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      if (i > 0) cursor.write(', ')
      if (element) cursor.visit(element)
   }
   cursor.write(']')
}

function OperatorExpression(node: AssignmentExpression | PrivateInExpression | LogicalExpression | BinaryExpression, cursor: CodePrinter) {
   cursor.visit(node.left)
   cursor.write(` ${node.operator} `)
   cursor.visit(node.right)
}

function writeLoopBody(node: ForOfStatement | ForInStatement | ForStatement | WhileStatement, cursor: CodePrinter) {
   if (node.body.type === 'BlockStatement') {
      cursor.write(' ')
      cursor.visit(node.body)
   }
   else {
      cursor.write('\n')
      cursor.enterScope()
      cursor.visit(node.body)
      cursor.exitScope()
   }
}



// #region: Types adapted from @svelte/esrap

export type BaseNode = {
   type: string;
};

type NodeOf<K extends string, X> = X extends { type: infer T } ? K extends T ? X : never : never;

export type Visitor<T> = (node: T, cursor: CodePrinter) => void;

export type Visitors<T extends BaseNode = BaseNode> = {
   [K in T['type']]?: Visitor<NodeOf<K, T>>;
} & {
   enter?: (node: T, cursor: CodePrinter, visit: (node: T) => void) => void
};

type FD = FunctionDeclaration['type']

// #endregion



class CodePrinter {
   code = ''
   map: CodeMapping[] = []

   private depth = 0;

   enterScope() {
      this.depth++
   }

   exitScope() {
      this.depth--
   }

   indentScope() {
      let scope = this.depth
      while (scope--) {
         this.write(TAB)
      }
   }

   indent() {
      this.write(TAB)
   }

   // get currentParent() { // TODO: we may not need this anymore
   //    return this.getParent()
   // }
   // private pushParent
   // private popParent
   // private getParent

   constructor(
      private visitors: Visitors<ASTNode>
   ) {

      visitors.FunctionDeclaration
      // const [pushParent, popParent, getParent] = createStack<BaseNode>()
      // this.pushParent = pushParent
      // this.popParent = popParent
      // this.getParent = getParent
   }

   write(text: string, src?: { start: number, end: number, capabilities: CodeMapping['data'] }) {
      const start = this.code.length
      this.code += text
      if (src) {
         const end = this.code.length
         const length = end - start
         if (length !== src.end - src.start)
            throw new InternalError('source-generated segment mismatch')

         this.map.push({
            sourceOffsets: [src.start],
            generatedOffsets: [start],
            data: src.capabilities,
            lengths: [length]
         })
      }
   }

   visited = new Set()

   private visitNode(node: ASTNode) {
      if (this.visited.has(node))
         return;
      this.visited.add(node)
      const visit = (this.visitors as Visitors)[node.type]
      if (!visit) throw new InternalError(`Visitor not yet implemented for ${node.type}`)
      if (this.visitors.enter) {
         this.visitors.enter(node, this, (node) => visit(node, this))
      }
      else {
         visit(node, this)
      }
   }

   visit(node: ASTNode, parent?: ASTNode) {
      // if (parent) this.pushParent(parent)
      this.visitNode(node)
      // if (parent) this.popParent()
   }


   visitEach(nodes: ASTNode[], parent?: ASTNode) {
      // if (parent) this.pushParent(parent)
      for (const node of nodes) {
         this.visitNode(node)
      }
      // if (parent) this.popParent()
   }

   visitFallback(node: ASTNode) {
      for (const value of Object.values(node as unknown as Record<string, unknown>)) {
         if (!value) continue
         if (Array.isArray(value)) {
            for (const item of value) {
               if (this.isNode(item)) this.visitNode(item)
            }
         }
         else if (this.isNode(value)) {
            this.visitNode(value)
         }
      }
   }

   private isNode(value: unknown): value is ASTNode {
      return !!value
         && typeof value === 'object'
         && 'type' in (value as Record<string, unknown>)
         && typeof (value as Record<string, unknown>).type === 'string'
   }
}

