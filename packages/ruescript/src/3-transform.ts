import { Function, ArrowFunctionExpression, AssignmentExpression, Node as ASTNode, CallExpression, Directive, Expression, ExpressionStatement, IfStatement, ImportDeclaration, ImportDeclarationSpecifier, ImportSpecifier, NullLiteral, Program, VariableDeclaration, VariableDeclarator, IdentifierName, BindingIdentifier, IdentifierReference, LabelIdentifier, AssignmentTarget, SimpleAssignmentTarget, UpdateExpression, TSThisParameter, TSIndexSignatureName, ObjectPropertyKind, JSXAttribute, BindingPattern, StringLiteral, TSTypeAnnotation, ObjectPattern, ArrayPattern, NumericLiteral, ObjectExpression, ObjectProperty, ArrayExpression, ArrayExpressionElement } from 'oxc-parser'
import { Edit, Edits } from "./1-preprocess.ts";
import { Cursor, traverse } from './traverse.ts';
import { BaseNode } from './4-generate.ts';
import { T } from 'node_modules/vitest/dist/chunks/traces.d.402V_yFI';

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
   // isAssignee?: boolean;
   // isProperty?: boolean;
}

function requireFrom<T, K extends keyof T>(obj: T, key: K): Exclude<T[K], undefined> {
   const value = obj[key]
   if (value === undefined) throw new Error(key.toString() + ' is missing from context')
   return value as Exclude<T[K], undefined>;
}


export function transformRXS(ast: ASTNode, edits: Edits) {
   // TODO:
   // let offset = 0;
   // traverseAll(ast, (node) => {
   //    // add offsets (based on edits)
   // })
   return traverse(ast, { edits } as Context, {
      Program(node, context) {
         this.visitEach(node.body, { ...context, program: node })
      },

      JSXAttribute(node, context) {
         const { edits } = context;
         /**
          * <Comp attribute />
          */
         if (node.value === null) {
            edits.at(node.start, edit => {
               if (edit.type !== 'JSXAttributeShorthand')
                  throw new InternalError(`Unexpected edit type ${edit.type}`)
               /**
                * source: <Comp {attribute} />
                * final: <Comp attribute={attribute} />
                */
               queueJSXAttributeShorthand(node, edit.identifier, this)
            })
         }
         this.visit(node.name)
         if (node.value) this.visit(node.value)
      },

      VariableDeclaration(node, context) {
         const { edits } = context

         if (node.kind == 'let') {
            edits.at(node.start, edit => {
               // if (edit.type === 'GetDeclaration' || edit.type === 'GetDestructuring') {
               const program = requireFrom(context, 'program');
               if (node.declarations.length !== 1) {
                  return; // TODO: throw compile error
               }
               const declarator = node.declarations[0]
               const { id, init } = declarator
               if (!init) {
                  return; // TODO: throw compile error
               }
               /**
                * source: get variable = expression
                * prepro: let variable = expression 
                * final: const variable = assertª(expression)
                */
               if (id.type === 'Identifier') {
                  this.willMutate(() => {
                     importFromRuescript('assertª', program);
                     node.kind = 'const'
                     declarator.init = CovertCallExpression('assertª', [init])
                  })
                  const variable = undoAccessorVariablePostfix(id, this, edits)
                  declareAbsorbedGetter(variable, this)
               }
               /**
               * source: get [a, b] = expression
               * source: get [a = () => 0, b] = expression
               * 
               * source: get { a, b } = expression
               * source: get { a = () => 0, b } = expression
               * final: const { a, b } = destructureª(expression, { a: 1, b: 1 })
               */
               else if (id.type === 'ObjectPattern' || id.type === 'ArrayPattern') {
                  declareAbsorbedGettersFromGetDestructuring(id, this, edits, context)
                  this.willMutate(() => {
                     const program = requireFrom(context, 'program')
                     importFromRuescript('destructureª', program)
                     node.kind = 'const'
                     declarator.init = CovertCallExpression('destructureª', [
                        init, id.type === 'ObjectPattern'
                           ? ObjectDestructuringMapFromGetKeyword(id)
                           : ArrayDestructuringMapFromGetKeyword(id)
                     ])
                  })
               }
               else {
                  throw new InternalError('uncovered case')
               }
               // }
            })
         }
         this.visitEach(node.declarations)
      },

      VariableDeclarator(node, context) {
         this.visit(node.id/* , { ...context, isAssignee: node.id.type === 'Identifier' } */)
         if (node.init) this.visit(node.init)
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
               edit = context.edits.find(node.start);
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
               this.visit(node.key/* , { ...context, isProperty: node.key.type === 'Identifier' } */)
               this.visit(node.value)
            }
            else { // spread and shorthand
               this.visit(node)
            }
         })
         if (edit !== undefined) {
            const program = requireFrom(context, 'program')

            this.willMutate(() => {
               importFromRuescript('assertª', program)
               importFromRuescript('absorbsª', program)
               importFromRuescript('absorbª', program)
               properties.forEach((node, index) => {
                  if (edits[index] && node.type === 'Property') {
                     node.value = CovertCallExpression('absorbª', [CovertCallExpression('assertª', [node.value])])
                  }
               })
               node.properties = properties
            })
            this.willReplace(node, CovertCallExpression('absorbsª', [node]))
         }
      },

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
         const { edits } = context
         const { object, property } = node
         this.visit(object)
         this.visit(property/* , { ...context, isProperty: property.type === 'Identifier' } */)

         if (!node.computed && property.type === 'Identifier') {
            /**
             * getter access
             * source: obj.count@
             * prepro: obj.countª
             * final: ªof(obj).count
             */
            if (property.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
               edits.at(node.end, () => {
                  const program = requireFrom(context, 'program')

                  this.willMutate(() => {
                     importFromRuescript('ªof', program)
                     property.name = property.name.slice(0, -1)
                  })
                  this.willReplace(node.object, CovertCallExpression('ªof', [node.object]))
               })
            }
         }
      },

      Identifier(leaf, context) {
         const { edits } = context
         if (isAssignee(leaf) || isPropertyKey(leaf)) {
            // TODO: unwrite invalid edits
            return;
         }
         if (!leaf.name || leaf.name === 'this') return; // exclude LabelIdentifier and TSIndexSignature and TSThisParameter
         if (this.scope.isAbsorbedGetter(leaf.name)) {
            /**
             * Absorbed getter access
             * source: count@
             * prepro: countª
             * final: count 
            */
            if (leaf.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
               edits.at(leaf.end, () => {
                  this.willMutate(() => {
                     leaf.name = leaf.name.slice(0, -1)
                  })
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
               const program = requireFrom(context, 'program')
               edits.at(leaf.end, () => {
                  this.willMutate(() => {
                     importFromRuescript('toª', program)
                     leaf.name = leaf.name.slice(0, -1)
                  })
                  this.willReplace(leaf, CovertCallExpression('toª', [leaf as Identifier]))
               })
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
               queueAccessorVariableWrite(this, node, 'left', left, context)
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
               break;

            case 'TSSatisfiesExpression':
               break;

            case 'TSTypeAssertion':
               break;

            default:
               break;
         }

         this.visit(node.left/* , { ...context, isAssignee: node.left.type === 'Identifier' } */)
         this.visit(node.right)
      },

      UpdateExpression(node, context) {
         const arg = node.argument
         switch (arg.type) {
            case 'Identifier':
               /**
                * source: count++;
                * final: assertµ(count).value++;
                */
               queueAccessorVariableWrite(this, node, 'argument', arg, context)
               break;

            case 'MemberExpression':

               break;

            case 'TSAsExpression':

               break;

            case 'TSNonNullExpression':
               break;

            case 'TSSatisfiesExpression':
               break;

            case 'TSTypeAssertion':
               break;

            default:
               break;
         }

         this.visit(arg/* , { ...context, isAssignee: arg.type === 'Identifier' } */)
      },

      CallExpression(node, context) {
         const { edits } = context

         this.visit(node.callee)
         this.visitEach(node.arguments)

         if (node.callee.type === 'TSNonNullExpression') {
            const nonNullExpression = node.callee
            edits.at(nonNullExpression.end, () => {
               /**
                * IIDE
                * (expression)@()
                */
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
            })
         }
      },


      TSNonNullExpression(node, context) {
         const { edits } = context
         this.visit(node.expression)

         /**
          * Derivation expression:
          * source: (expression)@
          * prepro: (expression)!
          * final: () => expression
         */
         edits.at(node.end, edit => {
            const expression = node.expression
            switch (edit.type) {
               case 'AccessorExpressionPostfix':

                  // foo()@
                  if (expression.type === 'CallExpression') {
                     const program = requireFrom(context, 'program')
                     this.willMutate(() => {
                        importFromRuescript('toª', program)
                     })
                     this.willReplace(node, CovertCallExpression('toª', [expression]))
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
                     if (exp.type === 'Identifier' || exp.type === 'CallExpression') {
                        const program = requireFrom(context, 'program')
                        this.willMutate(() => {
                           importFromRuescript('toª', program)
                        })
                        this.willReplace(node, CovertCallExpression('toª', [exp, CovertString('?')]))
                     }
                     // obj.count?@
                     // obj[count]?@
                     else if (exp.type === 'MemberExpression') {
                        const program = requireFrom(context, 'program')
                        this.willMutate(() => {
                           importFromRuescript('ªof', program)
                        })
                        this.willReplace(node, {
                           type: 'MemberExpression',
                           start: node.start,
                           end: node.end,
                           object: CovertCallExpression('ªof', [exp.object, CovertString('?')]),
                           property: exp.property as Identifier,
                           computed: exp.computed as false,
                           optional: false
                        })
                     }
                  }
                  break;

               case 'NonNullAccessorPostfix':
                  // foo()!@
                  // foo!@
                  if (expression.type === 'TSNonNullExpression') {
                     const exp = expression.expression
                     if (exp.type === 'Identifier' || exp.type === 'CallExpression') {
                        const program = requireFrom(context, 'program')
                        this.willMutate(() => {
                           importFromRuescript('toª', program)
                        })
                        this.willReplace(node, CovertCallExpression('toª', [expression]))
                     }
                     // obj[count]!@
                     // obj.count!@
                     else if (exp.type === 'MemberExpression') {
                        const program = requireFrom(context, 'program')
                        this.willMutate(() => {
                           importFromRuescript('ªof', program)
                        })
                        this.willReplace(node, {
                           type: 'MemberExpression',
                           start: node.start,
                           end: node.end,
                           object: CovertCallExpression('ªof', [exp.object, CovertString('!')]),
                           property: exp.property as Identifier,
                           computed: exp.computed as false,
                           optional: false
                        })
                     }
                  }
                  break;

               case 'BracketAccessorPostfix':
                  /**
                   * getter access
                   * source: obj[count]@
                   * prepro: obj[count]!
                   * final: ªof(obj)[count]
                   */
                  if (expression.type === 'MemberExpression') {
                     const program = requireFrom(context, 'program')
                     this.willMutate(() => {
                        importFromRuescript('ªof', program)
                     })
                     this.willReplace(node, {
                        type: 'MemberExpression',
                        start: node.start,
                        end: node.end,
                        object: CovertCallExpression('ªof', [expression.object]),
                        property: expression.property as Identifier,
                        computed: true,
                        optional: false
                     })
                  }
                  break;

               default:
                  break;
            }
         })
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
         const identifier = param.type === 'Identifier'
            ? param
            : param.type === 'AssignmentPattern' && param.left.type === 'Identifier'
               ? param.left
               : undefined
         // TODO: destructuring

         // simple parameter with @ operator
         if (identifier) {
            const parameter = identifier.name
            if (identifier.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
               context.edits.at(identifier.end, () => {
                  const program = requireFrom(context, 'program')
                  const variable = parameter.slice(0, -1)
                  cursor.scope.addAbsorbedGetter(parameter)
                  cursor.scope.addAbsorbedGetter(variable)
                  cursor.willMutate(() => {
                     importFromRuescript('toª', program)
                     // bar = toª(bar)
                     if (body.type === 'BlockStatement') {
                        body.body.unshift({
                           type: 'ExpressionStatement',
                           start: 0,
                           end: 0,
                           expression: {
                              type: 'AssignmentExpression',
                              start: 0,
                              end: 0,
                              left: CovertIdentifier(variable),
                              operator: '=',
                              right: CovertCallExpression('toª', [CovertIdentifier(variable)])
                           }
                        })
                     }
                  })
                  cursor.willMutate(() => identifier.name = variable)

                  // function foo(bar@ = () => 0) { ... }
                  if (param.type === 'AssignmentPattern') {
                     importFromRuescript('assertª', program)
                     cursor.willMutate(() => {
                        param.right = CovertCallExpression('assertª', [param.right])
                     })
                  }

               })
            }
         }
         else {
            // TODO: "ArrayPattern" | "ObjectPattern" | "RestElement"| "TSParameterProperty"
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

/**
 * @example
 * source: count = expression;
 * final: assertµ(count).value = expression;
 * 
 * source: count++;
 * final: assertµ(count).value++;
 */
function queueAccessorVariableWrite<T extends ASTNode, N extends AssignmentExpression | UpdateExpression>(
   cursor: Cursor<T, Context>,
   node: N,
   key: 'left' | 'argument',
   left: Identifier,
   context: Context
) {
   if (cursor.scope.isAbsorbedGetter(left.name)) {
      const program = requireFrom(context, 'program');

      cursor.willMutate(() => {
         importFromRuescript('assertµ', program);
         (node as AssignmentExpression)[key as 'left'] = {
            type: 'MemberExpression',
            start: 0,
            end: 0,
            computed: false,
            optional: false,
            object: CovertCallExpression('assertµ', [{
               type: 'Identifier',
               start: left.start,
               end: left.end,
               name: left.name
            }]),
            property: CovertIdentifier('value')
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

   const declaration = existing ?? CovertImportDeclaration(RUESCRIPT_IMPORT_SOURCE)
   const specifier = CovertImportSpecifier(importName)
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

function CovertImportDeclaration(source: string): ImportDeclaration {
   return {
      type: 'ImportDeclaration',
      start: 0,
      end: 0,
      phase: 'source',
      importKind: 'value',
      attributes: [],
      specifiers: [],
      source: CovertString(source)
   }
}


function CovertIdentifier(name: string): Identifier {
   return {
      type: 'Identifier',
      start: 0,
      end: 0,
      name: name
   }
}

function CovertString(string: string): StringLiteral {
   return {
      type: 'Literal',
      start: 0,
      end: 0,
      raw: `"${string}"`,
      value: string,
   }
}

function CovertNumber(num: number): NumericLiteral {
   return {
      type: 'Literal',
      start: 0,
      end: 0,
      raw: `${num}`,
      value: num,
   }
}

function CovertImportSpecifier(name: string): ImportSpecifier {

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


function CovertCallExpression(name: string, args: Expression[]): CallExpression {
   return {
      type: 'CallExpression',
      start: 0,
      end: 0,
      arguments: args,
      callee: {
         type: 'Identifier',
         start: 0,
         end: 0,
         name
      },
      optional: false
   }
}

/**
 * source: <Comp {attribute} />
 * final: <Comp attribute={attribute} />
 */
function queueJSXAttributeShorthand<T extends ASTNode, C>(node: JSXAttribute, identifier: string, cursor: Cursor<T, C>) {
   cursor.willMutate(() => {
      node.name.name = identifier // TODO: what if node.name is replaced before we mutate??
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
}



function isAssignee(node: Identifier & ASTNode) {
   const { parent } = node
   if (!parent) return false;
   return parent.type === 'VariableDeclarator' ||
      parent.type === 'UpdateExpression' ||
      parent.type === 'AssignmentExpression' && parent.left === node
}

function isPropertyKey(node: Identifier & ASTNode) {
   const parent = node.parent
   if (!parent) return false;
   return parent.type === 'MemberExpression' && parent.property === node ||
      parent.type === 'ObjectExpression' && parent.properties.find(property => property.type === 'Property' && property.key === node)
}


function declareAbsorbedGettersFromGetDestructuring<T extends ASTNode, C>(destructuring: ObjectPattern | ArrayPattern, cursor: Cursor<T, C>, edits: Edits, context: Context) {
   if (destructuring.type === 'ObjectPattern') {
      destructuring.properties.forEach(property => {
         if (property.type === 'RestElement') {
            // TODO: throw compile error?
            console.error('rest element not currently supported for `get` keyword destructuring')
            return;
         }
         const { key, value } = property
         if (key.type !== 'Identifier') {
            throw new InternalError('uncovered case')
         }
         cursor.skip(key)
         const propertyKey = undoAccessorVariablePostfix(key, cursor, edits)
         const identifier = value.type === 'Identifier' ? value : value.type === 'AssignmentPattern' ? value.left : undefined
         if (identifier?.type === 'Identifier') {
            cursor.skip(identifier)
            undoAccessorVariablePostfix(identifier, cursor, edits)
            declareAbsorbedGetter(propertyKey, cursor)
            if (value.type === 'AssignmentPattern') {
               const program = requireFrom(context, 'program')
               cursor.willMutate(() => {
                  importFromRuescript('assertª', program)
                  value.right = CovertCallExpression('assertª', [value.right])
               })
            }
         }
         // nested destructuring
         else if (value.type === 'ObjectPattern' || value.type === 'ArrayPattern') {
            declareAbsorbedGettersFromGetDestructuring(value, cursor, edits, context)
         }
      })
   }
   else {
      destructuring.elements.forEach(element => {
         if (!element) return;
         if (element.type === 'RestElement') {
            // TODO: throw compile error?
            console.error('rest element not currently supported for `get` keyword destructuring')
            return;
         }

         cursor.skip(element)
         const identifier = element.type === 'Identifier' ? element : element.type === 'AssignmentPattern' ? element.left : undefined
         if (identifier?.type === 'Identifier') {
            const propertyKey = undoAccessorVariablePostfix(identifier, cursor, edits)
            cursor.skip(identifier)
            undoAccessorVariablePostfix(identifier, cursor, edits)
            declareAbsorbedGetter(propertyKey, cursor)
            if (element.type === 'AssignmentPattern') {
               const program = requireFrom(context, 'program')
               cursor.willMutate(() => {
                  importFromRuescript('assertª', program)
                  element.right = CovertCallExpression('assertª', [element.right])
               })
            }
         }
         // nested destructuring
         else if (element.type === 'ObjectPattern' || element.type === 'ArrayPattern') {
            declareAbsorbedGettersFromGetDestructuring(element, cursor, edits, context)
         }
      })
   }
}

function undoAccessorVariablePostfix<T extends ASTNode, C>(node: Identifier, cursor: Cursor<T, C>, edits: Edits) {
   let variable = node.name
   if (node.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
      edits.at(node.end, edit => {
         variable = node.name.slice(0, -1) + '@'
         // unwrite ª --> @
         cursor.willMutate(() => {
            node.name = variable
         })
      })
   }
   return variable
}

function declareAbsorbedGetter<T extends ASTNode, C>(variable: string, cursor: Cursor<T, C>) {
   cursor.scope.addAbsorbedGetter(variable)
   cursor.scope.addAbsorbedGetter(variable + ACCESSOR_VARIABLE_POSTFIX)
}

function CovertObjectExpression(properties: ObjectPropertyKind[] = []): ObjectExpression {
   return {
      type: 'ObjectExpression',
      start: 0,
      end: 0,
      properties
   }
}

function CovertArrayExpression(elements: ArrayExpressionElement[] = []): ArrayExpression {
   return {
      type: 'ArrayExpression',
      start: 0,
      end: 0,
      elements
   }
}

function CovertObjectProperty(key: string, value: Expression, computed: boolean = false): ObjectProperty {
   return {
      type: 'Property',
      start: 0,
      end: 0,
      computed,
      key: CovertIdentifier(key),
      kind: 'init',
      method: false,
      shorthand: false,
      value
   }
}

// { a, b = 'hi' } --> { a: 1, b: 1 }
// { a, b: { c = 'hi' } = { c: 'hi' } }
function ObjectDestructuringMapFromGetKeyword(destructuring: ObjectPattern) {
   const objectExpression = CovertObjectExpression()
   const { properties } = destructuring

   properties.forEach((property, index) => {
      if (property.type === 'RestElement') {
         throw new InternalError('uncovered case')
         return; // TODO: throw compiler error?
      }
      const { key, value } = property
      if (key.type !== 'Identifier') {
         throw new InternalError('uncovered case')
         return; // TODO: throw compiler error?
      }
      const identifier = value.type === 'Identifier' ? value : value.type === 'AssignmentPattern' ? value.left : null
      if (identifier?.type === 'Identifier') {
         objectExpression.properties[index] = CovertObjectProperty(key.name, CovertNumber(1), property.computed)
      }
      else if (value.type === 'ObjectPattern') {
         objectExpression.properties[index] = CovertObjectProperty(key.name, ObjectDestructuringMapFromGetKeyword(value), property.computed)
      }
      else if (value.type === 'ArrayPattern') {
         objectExpression.properties[index] = CovertObjectProperty(key.name, ArrayDestructuringMapFromGetKeyword(value), property.computed)
      }
   })
   return objectExpression
}

function ArrayDestructuringMapFromGetKeyword(destructuring: ArrayPattern) {
   const arrayExpression = CovertArrayExpression()
   const { elements } = destructuring

   elements.forEach((element, index) => {
      if (!element) return;
      if (element.type === 'RestElement') {
         throw new InternalError('uncovered case')
         return; // TODO: throw compiler error?
      }
      const identifier = element.type === 'Identifier' ? element : element.type === 'AssignmentPattern' ? element.left : null
      if (identifier?.type === 'Identifier') {
         arrayExpression.elements[index] = CovertNumber(1)
      }
      else if (element.type === 'ObjectPattern') {
         arrayExpression.elements[index] = ObjectDestructuringMapFromGetKeyword(element)
      }
      else if (element.type === 'ArrayPattern') {
         arrayExpression.elements[index] = ArrayDestructuringMapFromGetKeyword(element)
      }
   })
   return arrayExpression
}

class InternalError extends Error { }