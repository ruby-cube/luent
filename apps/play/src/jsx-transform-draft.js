export default function (babel) {
   const { types: t } = babel;

   return {
      name: "ast-transform",
      visitor: {
         CallExpression(path) {
            const functionName = path.node.callee.name
            if (isTemplateFunction(functionName)) {
               transformTemplateFnCall(functionName, path)
            }
         }
      }
   };
}


const TemplateFunctions = new Map([
   ['If', transformIfCall],
   ['ElseIf', transformIfCall],
   ['Else', transformElseCall],
   ['For', true],
   ['jsx', transformJSXCall],
   ['_jsx', transformJSXCall],
   ['jsxs', transformJSXCall],
   ['_jsxs', transformJSXCall],
])


function isTemplateFunction(name) {
   return TemplateFunctions.has(name)
}

function transformTemplateFnCall(name, path) {
   TemplateFunctions.get(name)(path);
}

function transformIfCall(path) {
   const args = path.node.arguments
   if (isDerivation(path.get('arguments.0'))) {
      args[0] = toDerivationFunction(args[0])
   }

   transformTemplateArgToRenderFunction(args)
}

function transformTemplateArgToRenderFunction(args) {
   const lastIndex = args.length - 1;
   const templateArg = args[lastIndex]
   if (t.isCallExpression(templateArg) && isTemplateFunction(templateArg.callee.name)) {
      args[lastIndex] = toRenderFunction(templateArg)
   }
}

function toDerivationFunction(value) {
   return t.functionExpression(
      t.identifier('$'), // Function name ($) //TODO: add unique count id to prevent name collisions
      [], // No parameters
      t.blockStatement([
         t.returnStatement(value) // Return the original expression
      ])
   )
}


function transformElseCall(path) {
   transformTemplateArgToRenderFunction(path.node.arguments)
}

function isJSXFragment(name) {
   return !!name && (name === '_Fragment' || name === 'Fragment')
}

function transformJSXCall(path) {
   const args = path.node.arguments
   if (isJSXFragment(args[0].name)) {
      path.replaceWith(normalizeToArrayExpression(args[1].properties[0].value))
      return;
   }

   transformJSXAttributes(path.get('arguments.1.properties'))
}

function transformJSXChildren(childrenNode) {
   if (t.isObjectExpression(childrenNode.value)) {
      const properties = childrenNode.value.properties;
      for (const property of properties) {
         property.value = normalizeToRenderFunction(property.value)
      }
   }
   else {
      childrenNode.value = normalizeToRenderFunction(childrenNode.value)
   }
}

function normalizeToRenderFunction(node) {
   if (t.isFunction(node)) {
      return node;
   }
   return toRenderFunction(node)
}

function transformJSXAttributes(properties) {
   for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const propertyNode = property.node;
      const key = propertyNode.key;
      const name = t.isStringLiteral(key) ? key.value : key.name;
      if (name === 'children') {
         transformJSXChildren(propertyNode)
      }
      else if (hasTargetedEvent(name, propertyNode.value)) {
         propertyNode.value.body.left.arguments.push(t.identifier('e'))
      }
      else if (isDerivation(property.get('value'))) {
         propertyNode.value = toDerivationFunction(propertyNode.value)
      }
   }
}

function hasTargetedEvent(key, value) {
   return key.startsWith('on:') &&
      t.isArrowFunctionExpression(value) &&
      t.isLogicalExpression(value.body, { operator: '&&' }) &&
      t.isCallExpression(value.body.left) &&
      value.body.left.callee.name === 'target'
}

function toRenderFunction(node) {
   return t.arrowFunctionExpression(
      [], // No parameters
      t.isSequenceExpression(node) ? node : normalizeToArrayExpression(node) //TODO: normalizeToArrayExpression for last argument in sequence expression
   )
}

function normalizeToArrayExpression(node) {
   if (t.isArrayExpression(node)) return node;
   return t.arrayExpression([node])
}

// function isFunctionNode(path) {
//    const node = path.node;
//    if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
//       return true; // It's a function definition
//    }

//    if (t.isIdentifier(node)) {
//       // Check if the identifier refers to a function
//       const binding = path.scope.getBinding(node.name);
//       if (binding) {
//          const bindingNode = binding.path.node;
//          return (
//             t.isFunctionDeclaration(bindingNode) ||
//             t.isFunctionExpression(bindingNode) ||
//             t.isArrowFunctionExpression(bindingNode)
//          );
//       }
//    }

//    return false; // Not a function
// }

function isDerivation(path) {
   const node = path.node;
   if (t.isLiteral(node) || t.isIdentifier(node) || !node) {
      return false;
   }
   if (t.isExpression(node) && hasCallExpression(path)) {
      return true;
   }
   return false;
}


function hasCallExpression(path) {
   if (t.isCallExpression(path.node))
      return true;
   let found = false;
   path.traverse({
      CallExpression() {
         found = true;
         path.stop()
      }
   })
   return found;
}
