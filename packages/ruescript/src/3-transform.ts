import { Function, ArrowFunctionExpression, AssignmentExpression, Node as ASTNode, CallExpression, Directive, Expression, ExpressionStatement, IfStatement, ImportDeclaration, ImportDeclarationSpecifier, ImportSpecifier, NullLiteral, Program, VariableDeclaration, VariableDeclarator, IdentifierName, BindingIdentifier, IdentifierReference, LabelIdentifier, AssignmentTarget, SimpleAssignmentTarget, UpdateExpression, TSThisParameter, TSIndexSignatureName, ObjectPropertyKind } from 'oxc-parser'
import { Edit, Edits } from "./1-preprocess.ts";
import { Cursor, traverse } from './traverse.ts';

// TODO: type context, pass separately from cursor
// TODO: offsets
// TODO: How do I ensure all nodes that need transforms are reached?

// (1) offset and parent pass
// (2) queue transforms pass
// (3) apply transforms

type Context = {
   program?: Program;
   edits: Edits;
   scoped?: boolean;
}

function assertContext<T>(value: T | undefined, key: string): asserts value is T {
   if (!value) throw new Error(key + ' is missing from context')
}

export function transformRXS(ast: ASTNode, edits: Edits) {

   // TODO:
   // let offset = 0;
   // traverseAll(ast, (node) => {
   //    // add offsets (based on edits)
   // })
   return traverse(ast, { edits } as Context, {
      Program(node, context) {
         node.body.forEach(statement => {
            this.visit(statement, { ...context, program: node })
         })
      },

      JSXAttribute(node, context) {
         if (node.value === null) {
            const edit = context.edits.findStart(node.start)
            if (edit?.type === 'JSXAttributeShorthand') {
               const identifier = edit
                  // @ts-expect-error
                  .identifier
               this.willMutate(() => {
                  node.name.name = identifier
                  node.value = {
                     type: 'JSXExpressionContainer',
                     start: node.start,
                     end: node.end,
                     expression: {
                        type: 'Identifier',
                        start: node.start + 1,
                        end: node.end - 1,
                        name: identifier
                     }
                  }
               })
               return;
            }
         }
         this.visit(node.name)
         if (node.value) this.visit(node.value)
      },

      VariableDeclaration(node, context) {
         if (node.kind == 'let' && node.declarations.length === 1) {
            const edit = edits.findStart(node.start)
            if (edit && isGetVariableDeclaration(node, edit)) {
               const { program } = context;
               assertContext(program, 'program')

               this.willMutate(() => {
                  importFromRuescript('assertª', program);
                  node.kind = 'const'
               })
               node.declarations.forEach(node => {
                  /**
                   * source: get variable = expression
                   * prepro: let variable = expression 
                   * final: const variable = assertª(expression)
                   */
                  if (node.id.type === 'Identifier') {
                     const variable = node.id.name
                     this.scope.addAbsorbedGetter(variable)
                     this.scope.addAbsorbedGetter(variable + ACCESSOR_VARIABLE_POSTFIX)
                     this.willMutate(() => {
                        node.init = wrapInCall('assertª', node.init ?? {
                           type: 'Literal',
                           start: 0,
                           end: 0,
                           value: null,
                           raw: 'null'
                        })
                     })
                  }
                  /**
                  * source: get [a, b] = expression
                  * source: get { a, b } = expression
                  * source: get [a = () => 0, b] = expression
                  * source: get { a = () => 0, b } = expression
                  */
                  else {
                     // TODO: get destructuring declaration
                     // this.visit(node)
                  }
               })
            }
            else {
               this.visitEach(node.declarations)
            }
         }
         else {
            this.visitEach(node.declarations)
         }
      },

      /**
       * Accessor Property Colon Notation
       * source: { get variable: expression }
       * prepro: { gª, variable: expression }
       * final: absorbsª({ variable: absorbª(expression) })
       */
      ObjectExpression(node, context) {
         const properties: ObjectPropertyKind[] = []
         const edits: Edit[] = []
         let edit: Edit | null | undefined = undefined;

         node.properties.forEach(node => {
            if (node.type === 'Property'
               && node.key.type === 'Identifier'
               && node.key.name === 'gª'
               && node.shorthand === true
            ) {
               edit = context.edits.findStart(node.start);
               if (edit) {
                  return; // skip visiting children
               }
               else {
                  properties.push(node)
               }
            }
            else {
               if (edit) {
                  edits[properties.length] = edit
                  edit = null
               }
               properties.push(node)
            }

            if (node.type === 'Property' && !node.shorthand) {
               // intentionally skip visiting node.key
               this.visit(node.value)
            }
            else { // spread and shorthand
               this.visit(node)
            }
         })
         if (edit !== undefined) {
            const { program } = context
            assertContext(program, 'program')

            this.willMutate(() => {
               importFromRuescript('assertª', program)
               importFromRuescript('absorbsª', program)
               importFromRuescript('absorbª', program)
               properties.forEach((node, index) => {
                  if (edits[index] && node.type === 'Property') {
                     node.value = wrapInCall('absorbª', wrapInCall('assertª', node.value))
                  }
               })
               node.properties = properties
            })
            this.willReplace(node, wrapInCall('absorbsª', node))
         }
      },

      // VariableDeclarator(node, context) {
      //    this.visit(node.id)
      //    // if (node.id.type === 'Identifier') {
      //    //    this.scope.addVariable(node.id.name)
      //    // }
      // },


      // TODO: scoping

      BlockStatement(node, context) {
         if (context.scoped) {
            this.enterScope()
            this.visitEach(node.body)
            this.exitScope()
         }
         else {
            this.visitEach(node.body)
         }
      },

      FunctionDeclaration(node, context) {
         scopeFunction(this, node, context)
      },

      FunctionExpression(node, context) {
         scopeFunction(this, node, context)
      },

      ArrowFunctionExpression(node, context) {
         scopeFunction(this, node, context)
      },

      TSIndexSignature() {
         // intentionally skip visiting identifier
      },

      LabeledStatement(node) {
         // intentionally skip visiting identifier
         this.visit(node)
      },

      MemberExpression(node, context) {
         const property = node.property
         // node.computed
         // node.object
         if (property.type === 'Identifier') {
            /**
             * getter access
             * source: obj.count@
             * prepro: obj.countª
             * final: ªof(obj).count
             */
            if (property.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
               const { program } = context
               assertContext(program, 'program')
               const edit = context.edits.findEnd(node.end) 
               if (edit) {
                  this.willMutate(() => {
                     importFromRuescript('ªof', program)
                     property.name = property.name.slice(0, -1)
                  })
                  this.willReplace(node.object, wrapInCall('ªof', node.object))
               }
            }
         }
      },

      Identifier(leaf, context) {
         if (!leaf.name || leaf.name === 'this') return; // exclude LabelIdentifier and TSIndexSignature and TSThisParameter
         if (this.scope.isAbsorbedGetter(leaf.name)) {
            /**
             * Absorbed getter access
             * source: count@
             * prepro: countª
             * final: count 
            */
            if (leaf.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
               this.willMutate(() => {
                  leaf.name = leaf.name.slice(0, -1)
               })
            }
            /**
             * Absorbed getter read
             * source: count
             * prepro: count
             * final: count()
             * NOTE: assumes get variable declarations, TODO: get variable assignments have stopped traversal
             */
            else {
               this.willReplace(leaf, GetterCall(leaf))
            }
         }
         else {
            /**
             * Absorbed getter access
             * source: count@
             * prepro: countª
             * final: toª(count)
             */
            if (leaf.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
               const { program } = context
               assertContext(program, 'program')
               const edit = context.edits.findEnd(leaf.end)
               if (edit) {
                  this.willMutate(() => {
                     importFromRuescript('toª', program)
                     leaf.name = leaf.name.slice(0, -1)
                  })
                  this.willReplace(leaf, wrapInCall('toª', leaf as Identifier))
               }
            }
         }
      },
      AssignmentExpression(node, context) {
         const left = node.left
         switch (left.type) {
            case 'Identifier':
               /**
                * source: count = expression;
                * final: assertµ(count).value = expression;
                */
               transformAccessorVariableWrite(this, node, 'left', left, context)
               break;

            case 'ArrayPattern':

               break;
            case 'MemberExpression':

               break;
            case 'ObjectPattern':

               break;
            case 'TSAsExpression':

               break;
            case 'TSNonNullExpression':
               this.visit(left)
               break;

            case 'TSSatisfiesExpression':
               break;

            case 'TSTypeAssertion':
               break;

            default:
               break;
         }
         this.visit(node.right)
      },
      UpdateExpression(node, context) {
         const arg = node.argument
         switch (arg.type) {
            case 'Identifier':
               /**
                * source: count = expression;
                * final: assertµ(count).value = expression;
                */
               transformAccessorVariableWrite(this, node, 'argument', arg, context)
               break;

            case 'MemberExpression':

               break;

            case 'TSAsExpression':

               break;
            case 'TSNonNullExpression':
               this.visit(arg)
               break;

            case 'TSSatisfiesExpression':
               break;

            case 'TSTypeAssertion':
               break;

            default:
               break;
         }
      },

      CallExpression(node, context) {
         if (node.callee.type === 'TSNonNullExpression') {
            const nonNullExpression = node.callee
            const edit = context.edits.findEnd(nonNullExpression.end)
            /**
             * IIDE
             * (expression)@()
             */
            if (edit?.type === 'AccessorExpressionPostfix') {
               const expression = nonNullExpression.expression
               this.willReplace(node, {
                  type: 'CallExpression',
                  start: node.start,
                  end: node.end,
                  optional: false,
                  callee: {
                     type: 'ParenthesizedExpression',
                     start: 0,
                     end: 0,
                     expression: DerivationArrowFunctionExpression(expression)
                  },
                  arguments: []
               })
            }
            else {
               this.visit(node.callee)
               this.visitEach(node.arguments)
            }
            /**
             * {...statements}@() // TODO:
             */
         }
         else {
            this.visit(node.callee)
            this.visitEach(node.arguments)
         }
      },


      TSNonNullExpression(node, context) {
         const { program, edits } = context
         /**
          * Derivation expression:
          * source: (expression)@
          * prepro: (expression)!
          * final: () => expression
         */
         const edit = context.edits.findEnd(node.end)
         const expression = node.expression
         switch (edit?.type) {
            case 'AccessorExpressionPostfix':
               // foo()@
               if (expression.type === 'CallExpression') {
                  assertContext(program, 'program')
                  this.willMutate(() => {
                     importFromRuescript('toª', program)
                  })
                  this.willReplace(node, wrapInCall('toª', expression))
               }
               // (expression)@
               else if (expression.type === 'ParenthesizedExpression' || expression.type === 'SequenceExpression') {
                  this.willReplace(node, DerivationArrowFunctionExpression(expression))
               }
               break;

            case 'OptionalAccessorPostfix':
               // foo()?@
               // foo?@
               if (expression.type === 'TSNonNullExpression') {
                  const exp = expression.expression
                  if (exp.type === 'Identifier' || 'CallExpression') {
                     assertContext(program, 'program')
                     this.willMutate(() => {
                        importFromRuescript('toª', program)
                     })
                     this.willReplace(node, wrapInCall('toª', exp, {
                        type: 'Literal',
                        start: 0,
                        end: 0,
                        value: '?',
                        raw: "'?'"
                     }))
                  }
               }
               break;

            case 'NonNullAccessorPostfix':
               // foo()!@
               // foo!@
               if (expression.type === 'TSNonNullExpression') {
                  const exp = expression.expression
                  if (exp.type === 'Identifier' || 'CallExpression') {
                     assertContext(program, 'program')
                     this.willMutate(() => {
                        importFromRuescript('toª', program)
                     })
                     this.willReplace(node, wrapInCall('toª', expression))
                  }
               }
               break;

            default:
               break;
         }
      }
   })
}


function expressionHasAwait(node: ASTNode) {
   if (node.type === 'AwaitExpression') return true;
   if (node.type !== 'SequenceExpression') return false;
   let has = false;

   traverse(node as ASTNode, {}, {
      AwaitExpression() { has = true; }
   })

   return has;
}

function bodyHasAwait(node: ASTNode) {
   // TODO: 
}



function scopeFunction<T extends ASTNode>(cursor: Cursor<T, Context>, node: Function | ArrowFunctionExpression, context: Context) {
   const body = node.body
   if (body) {
      cursor.enterScope()
      node.params.forEach((param) => {
         if (param.type === 'Identifier') {
            // cursor.scope.addVariable(param.name)
            // TODO: parameter with @ operator

            const edit = context.edits.findStart(param.start)
            // if (isAbsorbedParameter(param, edit)) {

            // }
         }
         else {
            // TODO: "ArrayPattern" | "ObjectPattern" | "RestElement" | "AssignmentPattern" | "TSParameterProperty"
         }
      })
      cursor.visit(body, { ...context, scoped: true })
      cursor.exitScope()
   }
}




// [
//   {
//     type: 'GetDeclaration',
//     pos: 0,
//     original: 'get count ',
//     transformed: 'let count ',
//     valid: undefined,
//     identifier: 'count'
//   },
//   {
//     type: 'GetDeclaration',
//     pos: 20,
//     original: 'get other ',
//     transformed: 'let other ',
//     valid: undefined,
//     identifier: 'other'
//   }
// ]

// declaration 0 19 {
//   type: 'Identifier',
//   decorators: [],
//   name: 'count',
//   optional: false,
//   typeAnnotation: null,
//   start: 4,
//   end: 9
// }
// edit {
//   type: 'GetDeclaration',
//   pos: 0,
//   original: 'get count ',
//   transformed: 'let count ',
//   valid: undefined,
//   identifier: 'count'
// }
// declaration 20 49 {
//   type: 'Identifier',
//   decorators: [],
//   name: 'other',
//   optional: false,
//   typeAnnotation: null,
//   start: 24,
//   end: 29
// }

// function getEdit(pos: number, edits: Edit[]) {
//    // if (!edit) throw new Error('missing edit')
//    return findEdit(pos, edits)
// }

// #region  get variable transforms

export const ACCESSOR_VARIABLE_POSTFIX = 'ª'
export const ACCESSOR_EXPRESSION_POSTFIX = '!'

function isGetVariableDeclaration(declaration: VariableDeclaration, edit: Edit) {
   return edit.type === 'GetDeclaration' && edit.anchor === declaration.start
}

type Identifier = { name: string, start: number, end: number, type: 'Identifier' }

function GetterCall(node: Identifier): CallExpression {
   return {
      type: 'CallExpression',
      arguments: [],
      start: 0,
      end: 0,
      callee: node,
      optional: false
   }
}

function DerivationArrowFunctionExpression(expression: Expression): ArrowFunctionExpression {
   return {
      type: 'ArrowFunctionExpression',
      start: 0,
      end: 0,
      async: expression.type === 'ParenthesizedExpression' && expression.expression.type === 'AwaitExpression',
      body: expression,
      expression: true,
      generator: false,
      id: null,
      params: [],
   }
}

function transformAccessorVariableWrite<T extends ASTNode, N extends AssignmentExpression | UpdateExpression>(
   cursor: Cursor<T, Context>,
   node: N,
   key: 'left' | 'argument',
   left: Identifier,
   context: Context
) {
   if (cursor.scope.isAbsorbedGetter(left.name)) {
      const { program } = context;
      assertContext(program, 'program')

      cursor.willMutate(() => {
         importFromRuescript('assertµ', program);
         (node as AssignmentExpression)[key as 'left'] = {
            type: 'MemberExpression',
            start: 0,
            end: 0,
            computed: false,
            optional: false,
            object: {
               type: 'CallExpression',
               start: 0,
               end: 0,
               callee: {
                  type: 'Identifier',
                  start: 0,
                  end: 0,
                  name: 'assertµ'
               },
               arguments: [{
                  type: 'Identifier',
                  start: left.start,
                  end: left.end,
                  name: left.name
               }],
               optional: false
            },
            property: {
               type: 'Identifier',
               start: 0,
               end: 0,
               name: 'value'
            }
         }
      })
   }
}


// #endregion


// #region: import from ruescript

function importFromRuescript(importName: string, program: Program) {
   const existing = findRuescriptImport(program.body)
   if (existing && hasImport(importName, existing)) {
      return;
   }

   const declaration = existing ?? createRuescriptImportDeclaration()
   const specifier = createImportSpecifier(importName)
   declaration.specifiers.push(specifier)
   if (!existing) program.body.unshift(declaration)
}

function findRuescriptImport(body: Program['body']) {
   for (const statement of body) {
      if (statement.type === 'ImportDeclaration' && statement.source.value === RUESCRIPT_IMPORT_SOURCE) {
         return statement;
      }
   }
}

function hasImport(name: string, declaration: ImportDeclaration) {
   const specifiers = declaration.specifiers
   for (const specifier of specifiers) {
      if (specifier.local.name === name)
         return true;
   }
   return false;
}

const RUESCRIPT_IMPORT_SOURCE = '@rue/ruescript'

function createRuescriptImportDeclaration(): ImportDeclaration {
   return {
      type: 'ImportDeclaration',
      start: 0,
      end: 0,
      phase: 'source',
      importKind: 'value',
      attributes: [],
      specifiers: [],
      source: {
         type: 'Literal',
         start: 0,
         end: 0,
         raw: `"${RUESCRIPT_IMPORT_SOURCE}"`,
         value: RUESCRIPT_IMPORT_SOURCE,
      }
   }
}

function createImportSpecifier(name: string): ImportSpecifier {

   return {
      type: 'ImportSpecifier',
      start: 0,
      end: 0,
      imported: {
         type: 'Identifier',
         start: 0,
         end: 0,
         name
      },
      local: {
         type: 'Identifier',
         start: 0,
         end: 0,
         name
      },
      importKind: 'value',
   }
}



// #endregion


function wrapInCall(name: string, ...nodes: Expression[]): CallExpression {
   return {
      type: 'CallExpression',
      start: 0,
      end: 0,
      arguments: nodes,
      callee: {
         type: 'Identifier',
         start: 0,
         end: 0,
         name
      },
      optional: false
   }
}

class InternalError extends Error { }