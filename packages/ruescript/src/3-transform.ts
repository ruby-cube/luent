import { Function, ArrowFunctionExpression, AssignmentExpression, Node as ASTNode, CallExpression, Directive, Expression, ExpressionStatement, IfStatement, ImportDeclaration, ImportDeclarationSpecifier, ImportSpecifier, NullLiteral, Program, VariableDeclaration, VariableDeclarator, IdentifierName, BindingIdentifier, IdentifierReference, LabelIdentifier } from 'oxc-parser'
import { Edit } from "./1-preprocess";
import { Cursor, traverse } from './traverse';

// TODO: type context, pass separately from cursor
// TODO: offsets
// TODO: How do I ensure all nodes that need transforms are reached?

// (1) offset and parent pass
// (2) queue transforms pass
// (3) apply transforms

type Context = {
   program?: Program;
   edits: Edit[];
   scoped?: boolean;
}

function assertContext<T>(value: T | undefined, key: string): asserts value is T {
   if (!value) throw new Error(key + ' is missing from context')
}

export function transformRXS(ast: ASTNode, edits: Edit[]) {

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

      VariableDeclaration(node, context) {
         if (node.kind == 'let') {
            const edit = getEdit(node.start, edits)
            if (isGetVariableDeclaration(node, edit)) {
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
                     this.scope.addAbsorbedGetter(variable+ACCESSOR_POSTFIX_OPERATOR)
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

      Identifier(leaf, { edits }) {
         if (this.scope.isAbsorbedGetter(leaf.name)) {
            /**
             * Absorbed getter access
             * source: count@
             * prepro: countª
             * final: count 
            */
            if (isAbsorbedGetterAccess(leaf.name)) {
               
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
      },
   })
}



function scopeFunction<T extends ASTNode>(cursor: Cursor<T, Context>, node: Function, context: Context) {
   const body = node.body
   if (body) {
      cursor.enterScope()
      node.params.forEach((param) => {
         if (param.type === 'Identifier') {
            // cursor.scope.addVariable(param.name)
            // TODO: parameter with @ operator
            const edit = findEdit(param.start, context.edits)
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

let lastIndex = 0;

function findEdit(pos: number, edits: Edit[]) {
   const limit = edits.length;
   for (let i = lastIndex; i < limit; i++) {
      const edit = edits[i]
      if (pos >= edit.pos && pos < edit.pos + edit.original.length) { // TODO: should this be replacement or original length?
         lastIndex = i;
      }
      return edit
   }
}

function getEdit(pos: number, edits: Edit[]) {
   const edit = findEdit(pos, edits)
   if (!edit) throw new Error('missing edit')
   return edit
}

// #region  get variable transforms

export const ACCESSOR_POSTFIX_OPERATOR = 'ª'

function isAbsorbedGetterAccess(identifier: string) {
   return identifier.endsWith(ACCESSOR_POSTFIX_OPERATOR)
}

function isGetVariableDeclaration(declaration: VariableDeclaration, edit: Edit) {
   return edit.type === 'GetDeclaration' && edit.pos === declaration.start
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


function wrapInCall(name: string, node: Expression): CallExpression {
   return {
      type: 'CallExpression',
      start: 0,
      end: 0,
      arguments: [node],
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