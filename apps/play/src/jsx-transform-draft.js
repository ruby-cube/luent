import * as Babel from '@babel/types'
import { NodePath } from '@babel/traverse'

export default function (babel) {
   const { types: t } = babel;

   return {
      name: "ast-transform",
      visitor: {
         CallExpression(path) {
            const functionName = path.node.callee.name
            if (isJSXFunction(functionName)) {
               transformJSXFunction(functionName, path)
            }
         }
      }
   };
}


const JSXFunctions = new Map([
   ['If', transformIfCall],
   ['ElseIf', transformIfCall],
   ['Else', transformElseCall],
   ['For', true],
   ['jsx', transformJSXCall],
   ['_jsx', transformJSXCall],
   ['jsxs', transformJSXCall],
   ['_jsxs', transformJSXCall],
])


function isJSXFunction(name) {
   return JSXFunctions.has(name)
}

function transformJSXFunction(name, path) {
   JSXFunctions.get(name)(path.node.arguments);
}

function transformIfCall(args) {
   const condition = args[0];
   if (isDerivation(condition)) {
      args[0] = t.functionExpression(
         t.identifier('$'), // Function name ($) //TODO: add unique count id to prevent name collisions
         [], // No parameters
         t.blockStatement([
            t.returnStatement(condition) // Return the original expression
         ]))
   }
   transformToRenderFunction(args.at(-1))
}



function transformElseCall(path) {

}

function transformJSXCall(path) {

}

function transformToRenderFunction() {
   
}

function isDerivation(value) {
   if (t.isLiteral(value) || t.isIdentifier(value)) {
      return false;
   }
   if (t.isExpression(value)) {
      return true;
   }
   return false;
}



