import { walk } from 'zimmerframe';
import { ExpressionStatement, Program, Visitor, Node as ASTNode, AssignmentExpression } from 'oxc-parser'
import { Edit } from './1-preprocess';

const GET_VARIABLE_SUFFIX = 'ª'

export function transformRXS(ast: ASTNode, edits: Edit[]) {
   let lastIndex = 0;

   const transformed = walk(ast, null, {
      ExpressionStatement(node) {
         if (node.expression.type !== 'AssignmentExpression') return;
         if (isPreGetVariableDeclaration(node.expression)) {
            const result = findEdit(node.start, edits, lastIndex)
            if (!result) throw new Error('missing edit')
            const { edit, index } = result
            edit.valid = true
            lastIndex = index

            return {
               type: 'VariableDeclaration',
               kind: 'const',
               declarations: [{
                  type: 'VariableDeclarator',
                  init: node.expression.right,
                  id: {
                     type: 'Identifier',
                     name: edit.identifier + GET_VARIABLE_SUFFIX,
                     start: node.expression.start, // standin
                     end: node.expression.end
                  },
                  start: node.expression.start,
                  end: node.expression.end
               }],
               start: node.expression.start,
               end: node.expression.end
            }
         }
      }
   })
   console.log('ast', ast)
   console.log('transformed === ast', transformed === ast)
   return transformed
}


function findEdit(pos: number, edits: Edit[], start: number = 0) {
   const limit = edits.length;
   for (let i = start; i < limit; i++) {
      const edit = edits[i]
      console.log('edit', edit)
      console.log('pos', pos)
      if (pos >= edit.pos && pos < edit.original.length) //TODO: should this be replacement or original length?
         return {
            edit,
            index: i
         }
   }
}


function isPreGetVariableDeclaration(node: AssignmentExpression) {
   return node.type === 'AssignmentExpression' && node.left.type === 'Identifier' && node.left.name.startsWith('gÆt_')
}