import exp from "constants";

let t; //TODO: import from @babel/types


export default function lumoPreTransform({ types }) {
   console.log('lumo pre transform')
   t = types;
   return {
      name: "lumo-pre-transform",
      visitor: {
         JSXFragment(path) {
            transformTemplateCallExpressions(path)
            transformJSXFragment(path)
         },
         JSXElement(path) {
            transformTemplateCallExpressions(path)
            transformJSXElement(path)
         }
      }
   };
}

//TODO: 
/*
- `jsxAttributes()`

- `jsxStyle()`

- `jsxClass()`

- `jsxObject()`
*/

function transformJSXText(node) {
   const value = node.value.replace(/\n\s*/g, '')
   return value === '' ? null : t.stringLiteral(value)
}

function transformJSXFragment(path) {
   const children = path.get('children')
   transformJSXChildren(children)
   path.replaceWith(transformJSXChildrenToArrayExpression(children))
}

function transformJSXChildrenToArrayExpression(paths) {
   const array = []
   for (const child of paths) {
      if (t.isJSXText(child)) {
         const stringLiteral = transformJSXText(child.node)
         if (stringLiteral)
            array.push(stringLiteral)
      }
      else if (t.isJSXExpressionContainer(child.node)) {
         const expression = child.node.expression;
         if (t.isJSXEmptyExpression(expression))
            continue;
         array.push(expression)
      }
      else {
         array.push(child.node)
      }
   }
   const arrayExpression = t.arrayExpression(array)
   console.log('erray', arrayExpression)
   return arrayExpression
}


function transformTemplateCallExpressions(path) {
   path.traverse({
      CallExpression(path) {
         if (path.visited) return;
         console.log('=======template func')
         path.visited = true;
         const functionName = path.node.callee.name
         if (isTemplateFunction(functionName)) {
            transformTemplateFnCall(functionName, path)
         }
      }
   })
}


function normalizeSlotToRenderFunction(paths) { // returns jsxExpressionContainer with arrowFunctionExpression
   if (slotIsRenderFunction(paths)) return paths[0]; //TODO: still need to transform return of renderfunction if is derivation 
   console.log('child', paths[0].node)
   return transformChildrenToRenderFunction(paths)
}

function transformChildrenToRenderFunction(paths) {
   console.log('transforming children to render function', paths.length)
   return t.jsxExpressionContainer(
      t.arrowFunctionExpression(
         [],
         transformJSXChildrenToArrayExpression(paths)
      ));
}

function transformJSXChildren(childrenPath) {
   for (let i = 0; i < childrenPath.length; i++) {
      const child = childrenPath[i]
      if (t.isJSXExpressionContainer(child.node) && !t.isJSXEmptyExpression(child.node.expression)) {
         transformIfDerivationExpression(child.get('expression'))
      }
   }
   return childrenPath;
}

function transformIfDerivationExpression(path) {
   if (isDerivation(path))
      path.replaceWith(toDerivationFunction(path.node))
}

function isDerivationShorthand(expression) {
   const node = expression.node;
   if (t.isAssignmentExpression(node, { operator: '=' }) && node.left.name === '$' && isDerivation(expression.get('right'))) {
      return true;
   }
   return false;
}

// function transformIfDerivationExpression(expression) {
//    const node = expression.node;
//    if (t.isConditionalExpression(node)) {
//       if (isDerivation(expression.get('consequent')) && isParenthesized(node.consequent)) {
//          node.consequent = toDerivationFunction(node.consequent);
//       }
//       if (isDerivation(expression.get('alternate')) && isParenthesized(node.alternate)) {
//          node.alternate = toDerivationFunction(node.alternate);
//       }
//    }
//    if (t.isSequenceExpression(node)) {
//       const expressions = expression.get('expressions')
//       const finalExpression = expressions.at(-1);
//       if (isDerivation(finalExpression) && isParenthesized(finalExpression.node)) {
//          expressions[expressions.length] = toDerivationFunction(finalExpression.node);
//       }
//    }
//    if (isDerivation(expression) && isParenthesized(node)) {
//       expression.replaceWith(toDerivationFunction(node))
//    }
// }



function slotIsRenderFunction(paths) {
   if (paths.length !== 1) return false;
   const child = paths[0].node;
   console.log('slotisrenderfunction')
   if (!t.isJSXExpressionContainer(child)) return false;
   const expression = child.expression
   if (t.isArrowFunctionExpression(expression)
      || t.isFunctionExpression(expression) && !expression.id.name.startsWith('$drv'))
      return true;
   return false;
}

function isJSXRoot(node) {
   return t.isJSXFragment(node) || t.isJSXElement(node)
}




const TemplateFunctions = new Map([
   ['If', transformIfCall],
   ['ElseIf', transformIfCall],
   ['Else', transformElseCall],
   ['For', transformIfCall], //TODO:
   // ['jsxDEV', transformJSXFragmentCall],
   // ['jsx', transformJSXFragmentCall],
   // ['_jsx', transformJSXFragmentCall],
   // ['jsxsDEV', transformJSXFragmentCall],
   // ['jsxs', transformJSXFragmentCall],
   // ['_jsxs', transformJSXFragmentCall],
])


function isTemplateFunction(name) {
   return TemplateFunctions.has(name)
}

function transformTemplateFnCall(name, path) {
   TemplateFunctions.get(name)(path);
}

function transformIfCall(path) {
   console.log('if call')
   const args = path.node.arguments
   if (isDerivation(path.get('arguments.0'))) {
      args[0] = toDerivationFunction(args[0])
   }

   // console.log('if arg', args)
   transformTemplateArgToRenderFunction(args)
}

function transformTemplateArgToRenderFunction(args) {
   const lastIndex = args.length - 1;
   const templateArg = args[lastIndex]
   // console.log('transforming template arg', templateArg)
   if (t.isCallExpression(templateArg) && isTemplateFunction(templateArg.callee.name)) {
      //TODO: what if fragment is transformed to ArrayExpression before this transformation?
      args[lastIndex] = toRenderFunction(templateArg)
   }
   else if (templateArg && isJSXRoot(templateArg)) {
      args[lastIndex] = toRenderFunction(templateArg)
   }
}

let derivationCount = 0;

function toDerivationFunction(node) {
   return t.functionExpression(
      t.identifier('$drv' + ++derivationCount),
      [], // No parameters
      t.blockStatement([
         t.returnStatement(node) // Return the original expression
      ])
   )
}


function transformElseCall(path) {
   console.log('else call!')
   transformTemplateArgToRenderFunction(path.node.arguments)
}

function isJSXFragment(node) {
   if (t.isJSXFragment(node)) return true;
   if (!t.isCallExpression(node) || !isTemplateFunction(node.callee.name)) return false;
   const name = node.arguments[0].name;
   return !!name && (name === '_Fragment' || name === 'Fragment')
}

function transformJSXElement(path) {
   transformJSXAttributes(path)
   transformJSXSlot(path)
}

function transformJSXAttributes(jsxElementPath) {
   // path.openingElement.attributes[0].value
   const attributes = jsxElementPath.get('openingElement.attributes');
   for (const attribute of attributes) {
      const node = attribute.node
      const namespaceName = node.name.namespace && node.name.namespace.name
      const value = node.value;
      if (!t.isJSXExpressionContainer(value)) continue;
      if (t.isObjectExpression(value.expression)) {
         transformObjectProperties(attribute.get('value.expression.properties'))
      }
      else if (t.isArrayExpression(value.expression)) {
         transformArrayElements(attribute.get('value.expression.elements'))
      }
      else if (namespaceName === 'on' && hasTargetedEvent(value.expression)) {
         transformTargetCall(value.expression);

      }
      else if (namespaceName !== 'on' && namespaceName !== 'm') {
         transformIfDerivationExpression(attribute.get('value.expression'))
      }
   }
}

function transformTargetCall(eventListenerNode) {
   const paramNode = eventListenerNode.params[0]
   const eventParameter = paramNode && paramNode.name || 'e';
   if (!paramNode) eventListenerNode.params.push(t.identifier('e'))
   const left = eventListenerNode.body.left
   const targetCallArgs = t.isCallExpression(left) ? left.arguments : left.argument.arguments;
   targetCallArgs.push(t.identifier(eventParameter))
}

function transformJSXSlot(path) {
   const children = path.get('children')
   if (children.length === 0) return;
   transformJSXChildren(children)
   path.node.children = [normalizeSlotToRenderFunction(children)]
}



function transformArrayElements(elements) {
   for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const elementNode = element.node;
      if (t.isObjectExpression(elementNode)) {
         transformObjectProperties(element.get(`properties`))
      }
      else if (t.isArrayExpression(elementNode)) {
         transformArrayElements(element.get(`elements`))
      }
      else if (isDerivationShorthand(element)) {
         transformDerivationShorthand(element)
      }
   }
}

function transformDerivationShorthand(path) {
   path.replaceWith(toDerivationFunction(path.node.right))
}

function transformObjectProperties(properties) {
   for (let i = 0; i < properties.length; i++) {
      const value = properties[i].get('value')
      if (t.isObjectExpression(value.node)) {
         transformObjectProperties(value.get('properties'))
      }
      else if (t.isArrayExpression(value.node)) {
         transformArrayElements(value.get('elements'))
      }
      else if (isDerivationShorthand(value)) {
         transformDerivationShorthand(value)
      }
   }
}



function hasTargetedEvent(value) {
   return t.isArrowFunctionExpression(value) &&
      t.isLogicalExpression(value.body) &&
      (isTargetCall(value.body.left) ||
         t.isUnaryExpression(value.body.left, { operator: '!' }) &&
         isTargetCall(value.body.left.argument))
}

function isTargetCall(node) {
   return t.isCallExpression(node) && node.callee.name === 'target'
}

function toRenderFunction(node) {
   return t.arrowFunctionExpression(
      [], // No parameters
      t.isSequenceExpression(node) ? node : normalizeToArrayExpression(node) //TODO: normalizeToArrayExpression for last argument in sequence expression
   )
}

function normalizeToArrayExpression(node) {
   if (t.isArrayExpression(node)) return node;
   if (isJSXFragment(node)) return node;
   return t.arrayExpression([node])
}

function isDerivation(path) {
   const node = path.node;
   if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node) || t.isLiteral(node) || t.isIdentifier(node) || !node || t.isCallExpression(node) && isTemplateFunction(node.callee.name)) {
      return false;
   }
   if (t.isExpression(node) && (hasIonicCallExpression(path) || hasNonIonMemberExpression(path))) {
      console.log('checking if isDerivation?', node)
      return true;
   }
   return false;
}

const nonIonicCalls = new Set(['rein', 'readonly', 'slide', 'fade'])

function isPotentiallyIonicCall(callExpression) {
   return !nonIonicCalls.has(callExpression.callee.name)
}

//TODO: exclude rein() and readonly() and slide() etc...  should I require a $ prefix on calls?? 
function hasIonicCallExpression(path) {
   if (t.isCallExpression(path.node) && isPotentiallyIonicCall(path.node))
      return true;
   let found = false;
   path.traverse({
      CallExpression() {
         console.log('==========CALL EXPRESSION')
         found = true;
         path.stop()
      }
   })
   return found;
}

function hasNonIonMemberExpression(path) {
   const node = path.node
   if (t.isMemberExpression(node) && !node.property.name.startsWith('$'))
      return true;
   let found = false;
   path.traverse({
      MemberExpression(path) {
         console.log('==========MEMBER EXPRESSION', node.property)
         if (path.node.property.name.startsWith('$')) return;
         found = true;
         path.stop()
      }
   })
   return found;
}
