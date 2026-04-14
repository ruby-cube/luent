import { walk } from 'zimmerframe';
import { ExpressionStatement, Program, Visitor, Node as ASTNode, AssignmentExpression } from 'oxc-parser'
import { Edit } from './1-preprocess';

const GET_VARIABLE_SUFFIX = 'ª'
/**
 *  - unwrite invalid rewrites
 *  - adjust positions to source positions
 *  - transform
 * 
 * @param ast 
 * @param edits 
 * @returns 
 */
export function transformRXS(ast: ASTNode, edits: Edit[]) {
   let offset = 0;

   // TODO: build offsets from edits

   const transformed = walk(ast, {dog: 'hi'}, {

      // Literal(node) {
      //    const edit = findEdit(node.start, edits)
      //    if (!edit) return;
      //    const delta = edit.transformed.length - edit.original.length
      //    if (delta) {
      //       // unwrite insert
      //       return {
      //          type: 'Literal',
      //          start: offset + node.start,
      //          end: offset + node.end - delta,  // TODO: what about nested edits?
      //          value: unwriteEdit(node.value, edit),
      //          raw: unwriteEdit(node.raw, edit)
      //       }
      //    }
      //    // unwrite edit
      //    return {
      //       type: 'Literal',
      //       start: offset + node.start,
      //       end: offset + node.end,
      //       value: unwriteEdit(node.value, edit),
      //       raw: unwriteEdit(node.raw, edit)
      //    }
      // },
      ExpressionStatement(node) {
         if (node.expression.type !== 'AssignmentExpression') return;
         console.log('*** node', node)
         /**
          * get variable = expression
          * gÆt_variable = expression
          */
         if (isPreGetVariableDeclaration(node.expression)) {
            const edit = findEdit(node.start, edits)
            if (!edit) throw new Error('missing edit')

            const identifier = edit.identifier + GET_VARIABLE_SUFFIX;
            const identifierStart = node.expression.start + 'const'.length + 1
            const initializer = node.expression.right // TODO: need to visit and transform; offsets need to be adjusted on exit

            // const variableª = assertª(expression)
            return {
               type: 'VariableDeclaration',
               start: offset + node.expression.start,
               end: offset + node.expression.end,
               kind: 'const',
               declarations: [{
                  type: 'VariableDeclarator',
                  start: offset + identifierStart,
                  end: offset + node.expression.end,
                  id: {
                     type: 'Identifier',
                     start: offset + identifierStart,
                     end: offset + identifierStart + identifier.length,
                     name: identifier,
                  },
                  init: {
                     type: 'CallExpression',
                     start: offset + initializer.start,
                     end: offset + initializer.end,
                     callee: {
                        type: 'Identifier',
                        start: offset + initializer.start,
                        end: offset + initializer.end,
                        name: 'assertª',
                     },
                     arguments: [initializer],
                     optional: false
                  },
               }],
            }
         }
      }
   })

   console.log('ast', ast)
   console.log('transformed === ast', transformed === ast)
   return transformed
}



let lastIndex = 0;

function findEdit(pos: number, edits: Edit[]) {
   const limit = edits.length;
   for (let i = lastIndex; i < limit; i++) {
      const edit = edits[i]
      console.log('edit', edit)
      console.log('pos', pos)
      if (pos >= edit.pos && pos < edit.original.length) //TODO: should this be replacement or original length?
         lastIndex = i;
      return edit
   }
}


function isPreGetVariableDeclaration(node: AssignmentExpression) {
   return node.type === 'AssignmentExpression' && node.left.type === 'Identifier' && node.left.name.startsWith('gÆt_')
}