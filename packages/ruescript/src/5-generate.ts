import { Node as ASTNode, Program, VariableDeclarator, Visitor } from 'oxc-parser'
import { CodeMapping } from "@volar/language-core";
import { print } from 'esrap'
import { createStack } from '@rue/utils';
import tsx from 'esrap/languages/tsx';

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


function hasCapabilities(node: ASTNode): node is ASTNode & { capabilities: Capabilities } {
   return 'capabilities' in node
}

function modifiesIdentifier(node: ASTNode): node is ASTNode & { modifyIdentifier(): void } {
   return 'modifyIdentifier' in node
}

const TAB = '\t'


class InternalError extends Error { }

declare module 'oxc-parser' {
   interface VariableDeclarator {
      modifyIdentifier?: () => void
   }
   interface CallExpression {
      modifyIdentifier?: () => void
   }
}

export function printTSX(program: Program): { code: string, map: CodeMapping[] } {
   // console.log('ast', program) 
   // return print(program as unknown as TSNode, tsx())
   const file = new CodePrinter()

   const [pushParent, popParent, getParentNode] = createStack<ASTNode>()

   const getParent = {
      VariableDeclarationOf(node: VariableDeclarator) {
         const parent = getParentNode()
         if (parent?.type !== 'VariableDeclaration') {
            throw new InternalError('Invalid AST structure or incorrect parent stack')
         }
         return parent;
      }
   }


   const visitor = new Visitor({

      // const a: A = 1,
      //    b: B = 2, 
      //    c: C = 3;
      VariableDeclaration(node) {
         file.write(node.kind)
         file.write(' ')
         pushParent(node)
      },
      'VariableDeclaration:exit'() {
         popParent()
      },
      VariableDeclarator(node) {
         const parent = getParent.VariableDeclarationOf(node)
         const declarations = parent.declarations
         if (declarations.indexOf(node) !== 0) {
            file.write(TAB)
         }
         if (node.definite) {
            node.modifyIdentifier = () => file.write('!')
         }
         pushParent(node)
      },
      "VariableDeclarator:exit"(node) {
         popParent()
         const parent = getParent.VariableDeclarationOf(node)
         const declarations = parent.declarations
         if (declarations.indexOf(node) === declarations.length - 1) {
            file.write(';\n')
         }
         else {
            file.write(',\n')
         }
      },
      Identifier(leaf) {
         const parent = getParentNode()

         file.write(leaf.name,
            hasCapabilities(leaf)
               ? {
                  start: leaf.start,
                  end: leaf.end,
                  capabilities: leaf.capabilities
               }
               : undefined
         )

         if (parent && modifiesIdentifier(parent)) {
            parent.modifyIdentifier()
         }
      },
      'Identifier:exit'(leaf) {
         const parent = leaf.parent
         if (parent && parent.type === 'VariableDeclarator') {
            file.write(' = ')
         }
      },
      TSTypeAnnotation(node) {
         file.write(': ')
         pushParent(node)
      },
      TSTypeReference(node) {
         node.typeName.parent = node // TODO: not sure if this is actually necessary
      },
      // TODO: typeParameters
      TSAsExpression() {

      },
      Literal(leaf) {
         if (leaf.raw) {
            file.write(leaf.raw, {
               start: leaf.start,
               end: leaf.end,
               capabilities: { semantic: true }
            })
         }
      },
      PrivateIdentifier(leaf) {

      },

      ThisExpression(leaf) {

      },

      Super(leaf) {

      },

      MetaProperty(leaf) {

      },

      // run(a, b)
      // run?.()
      CallExpression(node) {
         if (node.optional) {
            node.modifyIdentifier = () => file.write('?.(')
         }
         else {
            node.modifyIdentifier = () => file.write('(')
         }
         pushParent(node)
      },
      'CallExpression:exit'(node) {
         file.write(')')
         popParent()
      }
   })

   pushParent(program)
   visitor.visit(program)
   popParent()

   return {
      code: file.code,
      map: file.map
   }
}


class CodePrinter {
   code = ''
   map: CodeMapping[] = []

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
}

