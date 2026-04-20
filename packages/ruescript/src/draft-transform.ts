import { AssignmentExpression, Node as ASTNode, Directive, ExpressionStatement, Program } from 'oxc-parser'
import { createStack } from "../../utils/index.ts";
import { Edit } from "./1-preprocess";
import { CHILD_KEYS } from './ast';
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

export function transform(ast: ASTNode, edits: Edit[]) {

   const {
      isPreGetVariableDeclaration,
      toGetVariableDeclaration
   } = GetVariableTransformKit()

   let offset = 0;

   // TODO:
   // traverseAll(ast, (node) => {
   //    // add offsets (based on edits)
   // })

   return traverse(ast, {} as Context, {
      Program(node, context) {
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
         if (isPreGetVariableDeclaration(node)) {
            const edit = getEdit(node.start, edits)

            this.willReplace(node, toGetVariableDeclaration(edit.identifier, node))
            this.willMutate(() => {
               const statement = findRueScriptImport(program.body)
               if (statement && !hasAssertGetterImport(program.body)) {
                  // TODO: insert assertª to import statement
               }
               else {
                  program?.body.push(createAssertGetterImport())
               }
            })

            this.visit(node.expression.right)
         }
      },

      VariableDeclarator(node, context) {
         this.visit(node.id)
         if (node.id.type === 'Identifier') {
            this.scope.addVariable(node.id.name)
         }
      },

      ParenthesizedExpression(node, context) {
         if (node.parent?.type === 'JSXExpressionContainer') { // if (isDerivationShorthandContext(node.parent))
            const container = node.parent
            this.willMutate(() => {
               container.expression = createDerivationShorthand(node.expression)
            })
         }
      }
   })
}


let lastIndex = 0;

function findEdit(pos: number, edits: Edit[]) {
   const limit = edits.length;
   for (let i = lastIndex; i < limit; i++) {
      const edit = edits[i]
      if (pos >= edit.pos && pos < edit.original.length) //TODO: should this be replacement or original length?
         lastIndex = i;
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
   function isPreGetVariableDeclaration(node: ExpressionStatement): node is ExpressionStatement & { expression: AssignmentExpression } {
      const expression = node.expression
      return expression.type === 'AssignmentExpression' && expression.left.type === 'Identifier' && expression.left.name.startsWith('gÆt_')
   }

   function toGetVariableDeclaration(name: string, node: { expression: AssignmentExpression }) {
      const identifier = name + GET_VARIABLE_SUFFIX;
      const identifierStart = node.expression.start + 'const'.length + 1
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
               start: initializer.start,
               end: initializer.end,
               callee: {
                  type: 'Identifier',
                  start: initializer.start,
                  end: initializer.end,
                  name: 'assertª',
               },
               arguments: [initializer],
               optional: false
            },
         }],
      }
   }

   return {
      isPreGetVariableDeclaration,
      toGetVariableDeclaration
   }
}


