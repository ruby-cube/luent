import { AssignmentExpression, Node as ASTNode, Directive, ExpressionStatement, ImportDeclaration, ImportDeclarationSpecifier, ImportSpecifier, Program, VariableDeclaration } from 'oxc-parser'
import { Edit } from "./1-preprocess";
import { traverse } from './traverse';

// TODO: type context, pass separately from cursor
// TODO: offsets
// TODO: How do I ensure all nodes that need transforms are reached?

// (1) offset and parent pass
// (2) queue transforms pass
// (3) apply transforms

type Context = {
   program?: Program
}

function assertContext<T>(value: T | undefined, key: string): asserts value is T {
   if (!value) throw new Error(key + ' is missing from context')
}

export function transformRXS(ast: ASTNode, edits: Edit[]) {

   const {
      isGetVariableDeclaration,
      toGetVariableDeclaration
   } = GetVariableTransformKit()


   // TODO:
   // let offset = 0;
   // traverseAll(ast, (node) => {
   //    // add offsets (based on edits)
   // })

   return traverse(ast, {} as Context, {
      Program(node) {
         node.body.forEach(statement => {
            this.visit(statement, { program: node })
         })
      },

      ExpressionStatement(node, { program }) {
         /**
          * get variable = expression
          * gÆt_variable = expression 
          * const variableª = assertª(expression)
         */
         if (isGetVariableDeclaration(node)) {
            assertContext(program, 'program')

            const edit = getEdit(node.start, edits)

            this.willReplace(node, toGetVariableDeclaration(edit.identifier, node))
            this.willMutate(() => importFromRuescript('assertª', program))

            this.visit(node.expression.right)
         }
      },

      VariableDeclarator(node, context) {
         this.visit(node.id)
         if (node.id.type === 'Identifier') {
            this.scope.addVariable(node.id.name)
         }
      },

      // TODO: scoping
   })
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


const GET_VARIABLE_SUFFIX = 'ª'

function GetVariableTransformKit() {

   function isGetVariableDeclaration(node: ExpressionStatement): node is ExpressionStatement & { expression: AssignmentExpression } {
      const expression = node.expression
      return expression.type === 'AssignmentExpression' && expression.left.type === 'Identifier' && expression.left.name.startsWith('gÆt_')
   }

   function toGetVariableDeclaration(name: string, node: { expression: AssignmentExpression }): VariableDeclaration {
      const identifier = name;
      const identifierStart = node.expression.start + 'get'.length + 1
      const initializer = node.expression.right

      return {
         type: 'VariableDeclaration',
         start: node.expression.start,
         end: node.expression.end,
         kind: 'const',
         declarations: [{
            type: 'VariableDeclarator',
            start: identifierStart,
            end: node.expression.end,
            id: {
               type: 'Identifier',
               start: identifierStart,
               end: identifierStart + identifier.length,
               name: identifier,
            },
            init: {
               type: 'CallExpression',
               start: 0,
               end: 0,
               callee: {
                  type: 'Identifier',
                  start: 0,
                  end: 0,
                  name: 'assertª',
               },
               arguments: [initializer],
               optional: false
            },
         }],
      }
   }

   return {
      isGetVariableDeclaration,
      toGetVariableDeclaration
   }
}


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
