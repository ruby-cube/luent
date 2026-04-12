import { Node as ASTNode, FunctionType, Program } from 'oxc-parser'
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
      
      ExpressionStatement(node, cursor) {
         node.directive //? TODO:
         cursor.indentScope()
         cursor.visit(node.expression)
         cursor.write(';\n')
      },

      // function id(a: A, b: B): Return { body }
      FunctionDeclaration(node, cursor) {
         cursor.indentScope()
         if (node.async) cursor.write('async ')
         cursor.write('function ')
         if (node.id) cursor.visit(node.id)
         cursor.write('(')
         for (const param of node.params) {
            // TODO:
            node.typeParameters
         }
         cursor.write(')')
         if (node.returnType) {
            cursor.write(': ')
            cursor.visit(node.returnType)
         }
         if (node.body) cursor.visit(node.body)
         else cursor.write('{ }')

         // TODO:
         node.declare // ?
         node.expression
         node.generator
      },


      // { body }
      BlockStatement(node, cursor) {
         cursor.write('{')
         cursor.enterScope()
         cursor.visitEach(node.body)
         cursor.exitScope()
         cursor.write('}')
      },


      // const a: A = 1,
      //    b: B = 2, 
      //    c: C = 3;
      VariableDeclaration(node, cursor) {
         cursor.indentScope()
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
         node.declare //? TODO:
      },

      // a!: Typed = 0
      VariableDeclarator(node, cursor) {
         cursor.visit(node.id)
         if (node.definite) cursor.write('!')
         if (node.id.typeAnnotation) cursor.visit(node.id.typeAnnotation)
         cursor.write(' = ')
         if (!node.init) throw new SyntaxError('')
         cursor.visit(node.init)
      },

      Identifier(node, cursor) {
         node.decorators
         // NOTE: node.typeAnnotation is written by parent

         cursor.write(node.name, withCapabilities(node, node.start, node.end))
         if (node.optional) cursor.write('?')
      },

      TSTypeAnnotation(node, cursor) {
         cursor.write(': ')
         cursor.visit(node.typeAnnotation)
      },
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
            node.typeArguments
            cursor.write('>')
         }
      },

      // expression as typeAnnotation
      TSAsExpression(node, cursor) {
         cursor.visit(node.expression)
         cursor.write(' as ')
         cursor.visit(node.typeAnnotation)
      },

      Literal(leaf, cursor) {
         if (leaf.raw) {
            cursor.write(leaf.raw, { // ONLY IF node has capabilities
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
      CallExpression(node, cursor) {
         node.typeArguments // TODO: ??

         cursor.visit(node.callee)
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
   })

   file.visit(program)

   return {
      code: file.code,
      map: file.map
   }
}

// #region: Types adapted from @svelte/esrap

export type BaseNode = {
   type: string;
};

type NodeOf<K extends string, X> = X extends { type: infer T } ? K extends T ? X : never : never;

export type Visitor<T> = (node: T, file: CodePrinter) => void;

export type Visitors<T extends BaseNode = BaseNode> = {
   [K in T['type']]?: Visitor<NodeOf<K, T>>;
} & {
   enter?: (node: T, file: CodePrinter, visit: (node: T) => void) => void
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
         throw new InternalError('Node has already been visited')
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
}

