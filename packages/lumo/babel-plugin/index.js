import exp from "constants";

let t; //TODO: import from @babel/types


export default function lumoPreTransform({ types }) {
   console.log('lumo pre transform')
   t = types;
   return {
      name: "lumo-pre-transform",
      visitor: {
         JSXFragment: {
            enter(path) {
               transformLiterals(path)
               transformTemplateCallExpressions(path)
               transformJSXFragment(path)
            },
            exit(path) {
            }
         },
         JSXElement: {
            enter(path) {
               transformLiterals(path)
               transformTemplateCallExpressions(path)
               transformJSXElement(path)
            },
            exit(path) {
            }
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
   arrayExpression.visited = true;
   return arrayExpression
}


function transformTemplateCallExpressions(path) {
   path.traverse({
      CallExpression(path) {
         if (path.visited) return;
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
   return transformChildrenToRenderFunction(paths)
}

function transformChildrenToRenderFunction(paths) {
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
   if (isDerivationShorthand(path)) {
      // transformLiterals(path.get('right'))
      path.replaceWith(toDerivationFunction(path.node.right))
   }
   else if (isDerivation(path)) {
      // console.log('isDerivation', path.node)
      // transformLiterals(path)
      path.replaceWith(toDerivationFunction(path.node))
   }
}

function transformLiterals(path) {
   path.traverse({
      ObjectExpression(path) {
         if (path.visited || path.node.visited) {
            console.log('visited!')
            return;
         }
         path.visited = true;
         transformObjectProperties(path.get('properties'))
      },
      ArrayExpression(path) {
         if (path.visited || path.node.visited) {
            console.log('array visited!')
            return;
         }
         path.visited = true;
         transformArrayElements(path.get('elements'))
      }
   })
}

function isDerivationShorthand(path) {
   const node = path.node;
   if (t.isAssignmentExpression(node, { operator: '=' }) && node.left.name === '$' && t.isExpression(node.right)) {
      return true;
   }
   return false;
}




function slotIsRenderFunction(paths) {
   if (paths.length !== 1) return false;
   const child = paths[0].node;
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
   transformIfDerivationExpression(path.get('arguments.0'))
   transformTemplateArgToRenderFunction(path.node.arguments)
}

function transformTemplateArgToRenderFunction(args) {
   const lastIndex = args.length - 1;
   const templateArg = args[lastIndex]
   // console.log('transforming template arg', templateArg)
   if (
      t.isCallExpression(templateArg) && isTemplateFunction(templateArg.callee.name)
      ||templateArg && isJSXRoot(templateArg)
      || t.isSequenceExpression(templateArg)
   ) {
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
      // if (t.isObjectExpression(value.expression)) {
      //    transformObjectProperties(attribute.get('value.expression.properties'))
      // }
      // else if (t.isArrayExpression(value.expression)) {
      //    transformArrayElements(attribute.get('value.expression.elements'))
      // }
      // else 
      if (namespaceName === 'on' && hasTargetedEvent(value.expression)) {
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



function transformArrayElements(paths) {
   for (let i = 0; i < paths.length; i++) {
      const element = paths[i];
      const elementNode = element.node;
      if (t.isObjectExpression(elementNode)) {
         transformObjectProperties(element.get(`properties`))
      }
      else if (t.isArrayExpression(elementNode)) {
         transformArrayElements(element.get(`elements`))
      }
      else {
         transformIfDerivationExpression(element)
      }
   }
}



function transformObjectProperties(paths) {
   for (let i = 0; i < paths.length; i++) {
      const value = paths[i].get('value')
      if (t.isObjectExpression(value.node)) {
         transformObjectProperties(value.get('properties'))
      }
      else if (t.isArrayExpression(value.node)) {
         transformArrayElements(value.get('elements'))
      }
      else {
         transformIfDerivationExpression(value)
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
      normalizeToArrayExpression(node)
   )
}


function normalizeToArrayExpression(node) {
   if (t.isArrayExpression(node)) return node;
   if (isJSXFragment(node)) return node;
   if (t.isSequenceExpression(node)){
      console.log('sequence expression!!')
      return normalizeToArrayExpression(node.expressions.at(-1))
   }
   const arrayExpression = t.arrayExpression([node])
   arrayExpression.visited = true;
   return arrayExpression
}

function isDerivation(path) {
   const node = path.node;
   if (!node || !t.isExpression(node))
      return false;
   if (t.isArrowFunctionExpression(node)
      || t.isFunctionExpression(node)
      || t.isObjectExpression(node)
      || t.isArrayExpression(node)
      || t.isIdentifier(node)
      || t.isCallExpression(node) && isTemplateFunction(node.callee.name)) {
      return false;
   }
   if (hasIonicCallExpression(path)) {
      return true;
   }
   return false;
}

function hasIonicCallExpression(path) {
   if (isIonicCallExpression(path.node))
      return true;
   let found = false;
   path.traverse({
      CallExpression(path) {
         if (isIonicCallExpression(path.node)) {
            found = true;
            path.stop()
         }
      }
   })
   return found;
}

function isIonicCallExpression(node) {
   return t.isCallExpression(node) && /^\$[a-z]/.test(node.callee.name) && node.arguments.length === 0 && !isParenthesized(node)
}

function isParenthesized(node){
return 'extra' in node && node.extra.parenthesized === true;
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
