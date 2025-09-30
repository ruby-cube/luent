import exp from "constants";

let t; //TODO: import from @babel/types


export default function lumoPreTransform({ types }) {
   console.log('lumo pre transform')
   t = types;

   return {
      name: "lumo-pre-transform",
      visitor: {
         // Program: {
         //    enter(path) {
         //       path.traverse({
         //          ImportDeclaration(path) {
         //             // prevent name collisions
         //             // storeLocalNameOfImport(path, 'watch', this.localWatchNames)
         //             // storeLocalNameOfImport(path, 'ionicTask', this.localIonicTaskNames)
         //          },

         //          CallExpression(path) {
         //             transformWatchCalls(path, this.localWatchNames) //TODO: MultiSubject watch calls
         //             // transformIonicTaskCalls(path, this.localIonicTaskNames)
         //          }
         //       }, { localWatchNames: new Set(), localIonicTaskNames: new Set() })
         //    }
         // },
         // Identifier: {
         //    enter(path) {
         //       if (path.visited || path.node.created) return;
         //       transformIdentifier(path)
         //       path.visited = true;
         //    }
         // },
         // VariableDeclarator: {
         //    enter(path) {
         //       transformIfDerivationShorthand(path.get('init'))
         //    }
         // },
         CallExpression: {
            enter(path) {
               transformTemplateCallExpressions(path)
            }
         },
         JSXFragment: {
            enter(path) {
               // transformConditionalSeries(path)
               transformLiterals(path)
               transformTemplateCallExpressions(path)
               transformJSXFragment(path)
            }
         },
         JSXElement: {
            enter(path) {
               // transformConditionalSeries(path)
               transformLiterals(path)
               transformTemplateCallExpressions(path)
               transformJSXElement(path)
            }
         }
      }
   };
}


const conditionalStatements = {
   If: true,
   ElseIf: true,
   Else: true
}


function isIfSeriesElement(node) {
   return t.isCallExpression(node) && node.callee.name in conditionalStatements
}

function isTrySeriesElement(node, seriesType) {
   return t.isCallExpression(node) && (node.callee.name === 'Try' || node.callee.name === 'Catch' && seriesType === 'Try')
}

function isAwaitSeriesElement(node, seriesType) {
   return t.isCallExpression(node) && (
      node.callee.name === 'Await'
      || node.callee.name === 'Meanwhile'
      || node.callee.name === 'Catch' && seriesType === 'Await'
   )
}

// function transformConditionalSeries(path) {
//    const children = path.node.children
//    if (children.length === 0) return;
//    path.node.children = consolidateSeries(children)
// }

// function consolidateSeries(children) {
//    const newChildren = []
//    let conditionalSeries;
//    for (const node of children) {
//       if (t.isJSXExpressionContainer(node) && isIfSeriesElement(node.expression)) {
//          if (node.expression.callee.name === 'If') {
//             if (conditionalSeries) newChildren.push(createIfSeriesElement(conditionalSeries))
//             conditionalSeries = [node.expression]
//          }
//          else {
//             conditionalSeries.push(node.expression)
//          }
//       }
//       else if (t.isJSXText(node)) {
//          const stringLiteral = transformJSXText(node)
//          if (stringLiteral) {
//             if (conditionalSeries) {
//                newChildren.push(createIfSeriesElement(conditionalSeries))
//                conditionalSeries = undefined;
//             }
//             newChildren.push(stringLiteral)
//          }
//       }
//       else if (conditionalSeries) {
//          console.log('uh oh', node)
//          newChildren.push(createIfSeriesElement(conditionalSeries))
//          conditionalSeries = undefined;
//          newChildren.push(node)
//       } else {
//          newChildren.push(node)
//       }
//    }
//    if (conditionalSeries) newChildren.push(createIfSeriesElement(conditionalSeries))
//    console.log('oldchildren', children.length)
//    console.log('newChildren', newChildren.length)
//    // return children
//    return newChildren;
// }

function createIfSeries(series) {
   return t.callExpression(t.identifier('_$$IfSeries'), [t.ArrayExpression(series)])
}

function createTrySeries(series) {
   return t.callExpression(t.identifier('_$$TrySeries'), series)
}

function createAwaitSeries(series) {
   return t.callExpression(t.identifier('_$$AwaitSeries'), [t.ArrayExpression(series)])
}


// function storeLocalNameOfImport(path, functionName, localNames) {
//    if (path.node.source.value === '@rue/quarky') {
//       for (const specifier of path.node.specifiers) {
//          if (
//             t.isImportSpecifier(specifier) &&
//             specifier.imported.name === functionName
//          ) {
//             localNames.add(specifier.local.name);
//          }
//       }
//    }
// }

// function transformWatchCalls(path, localWatchNames) {
//    const callee = path.get('callee');
//    if (
//       t.isIdentifier(callee.node) &&
//       localWatchNames.has(callee.node.name)
//    ) {
//       transformWatchSubject(path)
//    }
// }

// function transformIonicTaskCalls(path, localIonicTaskNames) {
//    const functionName = path.node.callee.name
//    if (localIonicTaskNames.has(functionName)) {
//       const effectFnP = path.get('arguments')[0]
//       const effectBody = effectFnP.get('body')
//       const watchFnName = effectFnP.node.params[0].name
//       effectBody.traverse({
//          CallExpression(path) {
//             if (path.visited) return;
//             path.visited = true;

//             if (path.node.callee.name === watchFnName) {
//                transformWatchSubject(path);
//             }
//          }
//       })
//    }
// }



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
   let series;
   let seriesType;

   function closeSeries() {
      if (series) {
         switch (seriesType) {
            case 'If':
               array.push(createIfSeries(series))
               break;

            case 'Try':
               array.push(createTrySeries(series))
               break;

            case 'Await':
               array.push(createAwaitSeries(series))
               break;

            default:
               break;
         }
         series = null;
         seriesType = null;
      }
   }

   for (const child of paths) {
      const node = child.node
      if (t.isJSXExpressionContainer(node) && isIfSeriesElement(node.expression)) {
         if (node.expression.callee.name === 'If') {
            closeSeries()
            seriesType = 'If'
            series = [node.expression]
         }
         else if (node.expression.callee.name === 'Else') {
            series.push(node.expression)
            closeSeries()
         }
         else {
            series.push(node.expression)
         }
      }
      else if (t.isJSXExpressionContainer(node) && isTrySeriesElement(node.expression, seriesType)) {
         if (node.expression.callee.name === 'Try') {
            closeSeries()
            seriesType = 'Try'
            series = [node.expression]
         }
         else if (node.expression.callee.name === 'Catch') {
            series.push(node.expression)
            closeSeries()
         }
      }
      else if (t.isJSXExpressionContainer(node) && isAwaitSeriesElement(node.expression, seriesType)) {
         if (node.expression.callee.name === 'Await') {
            closeSeries()
            seriesType = 'Await'
            series = [node.expression]
         }
         else if (node.expression.callee.name === 'Catch') {
            series.push(node.expression)
            closeSeries()
         }
         else {
            series.push(node.expression)
         }
      }
      else if (t.isJSXText(node)) {
         const stringLiteral = transformJSXText(node)
         if (stringLiteral) {
            closeSeries()
            array.push(stringLiteral)
         }
      }
      else if (t.isJSXExpressionContainer(node)) {
         const expression = node.expression;
         if (t.isJSXEmptyExpression(expression))
            continue;
         closeSeries()
         array.push(expression)
      }
      else {
         closeSeries()
         array.push(node)
      }
   }
   closeSeries()
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
   if (slotIsRenderFunction(paths)) return paths[0].node; //TODO: still need to transform return of renderfunction if is derivation 
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
         transformIfDerivationShorthand(child.get('expression'))
      }
   }
   return childrenPath;
}

function transformIfDerivationShorthand(path) {
   if (!path || !path.node) return;
   console.log('DERIVATION?', path.node)
   if (isDerivationShorthand(path)) {
      // transformLiterals(path.get('right'))
      path.replaceWith(toDerivationFunction(path.node))
   }
   // else if (isDerivation(path)) {
   //    // console.log('isDerivation', path.node)
   //    // transformLiterals(path)
   //    path.replaceWith(toDerivationFunction(path.node))
   // }
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
   return isParenthesized(node) && !t.isIdentifier(node);
   // if (t.isAssignmentExpression(node, { operator: '=' }) && node.left.name === '$' && t.isExpression(node.right)) {
   //    return true;
   // }
   // return false;
}




function slotIsRenderFunction(paths) {
   if (paths.length !== 1) return false;
   const child = paths[0].node;
   if (!t.isJSXExpressionContainer(child)) return false;
   const expression = child.expression
   if (t.isArrowFunctionExpression(expression))
      // || t.isFunctionExpression(expression) && !expression.id.name.startsWith('$drv'))
      return true;
   return false;
}

function isJSXRoot(node) {
   return t.isJSXFragment(node) || t.isJSXElement(node)
}




const TemplateFunctions = {
   If: transformIfCall,
   ElseIf: transformIfCall,
   Else: transformConditionalJSX,
   Try: transformTemplateArgToRenderFunction,
   Await: transformTemplateArgToRenderFunction,
   Meanwhile: transformTemplateArgToRenderFunction,
   For: transformTemplateArgToRenderFunction,
   Portal: transformTemplateArgToRenderFunction,
   // ['jsxDEV', transformJSXFragmentCall],
   // ['jsx', transformJSXFragmentCall],
   // ['_jsx', transformJSXFragmentCall],
   // ['jsxsDEV', transformJSXFragmentCall],
   // ['jsxs', transformJSXFragmentCall],
   // ['_jsxs', transformJSXFragmentCall],
}




function isTemplateFunction(name) {
   return name in TemplateFunctions
}

function transformTemplateFnCall(name, path) {
   TemplateFunctions[name](path);
}

function transformConditionalJSX(path) {
   const lastArg = path.get('arguments').at(-1)
   if (t.isArrowFunctionExpression(lastArg.node)) {
      removeConditionAssertionTypeHelper(lastArg)
   }
   transformTemplateArgToRenderFunction(path)
}

function transformIfCall(path) {
   transformIfDerivationShorthand(path.get('arguments.0'))
   transformConditionalJSX(path)

}

function removeConditionAssertionTypeHelper(path) {
   const params = path.node.params
   if (!params.length) return;
   if (params[0].name === 'v') {
      path.traverse({
         CallExpression(path) {
            if (path.node.callee.name !== 'v') return;
            if (path.node.arguments.length !== 1) return;
            const arg = path.get('arguments.0');
            path.replaceWith(arg.node)
         }
      })
   }
}

function transformTemplateArgToRenderFunction(path) {
   const args = path.node.arguments
   const lastIndex = args.length - 1;
   const templateArg = args[lastIndex]
   // console.log('transforming template arg', templateArg)
   if (
      t.isCallExpression(templateArg) && isTemplateFunction(templateArg.callee.name)
      || templateArg && isJSXRoot(templateArg)
      || t.isSequenceExpression(templateArg)
   ) {
      args[lastIndex] = toRenderFunction(templateArg)
   }
}

let derivationCount = 0;

//TODO: import $_derivation
function toDerivationFunction(node) {
   // return t.arrowFunctionExpression([], t.blockStatement([
   //    t.returnStatement(node) // Return the original expression
   // ]))
   return t.callExpression(t.identifier('$_derivation'), [t.arrowFunctionExpression([], t.blockStatement([
      t.returnStatement(node) // Return the original expression
   ]))])
   // return t.functionExpression(
   //    t.identifier('$drv' + ++derivationCount),
   //    [], // No parameters
   //    t.blockStatement([
   //       t.returnStatement(node) // Return the original expression
   //    ])
   // )
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
         transformIfDerivationShorthand(attribute.get('value.expression'))
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
   if (hasNamedSlot(children)) {
      path.node.children = [transformToNamedSlots(children)]
   }
   else {
      transformJSXChildren(children)
      path.node.children = [normalizeSlotToRenderFunction(children)]
   }
}

function hasNamedSlot(childPaths) {
   for (const path of childPaths) {
      if (isNamedSlot(path.node))
         return true;
   }
   return false;
}

function isNamedSlot(node) {
   if (!t.isJSXElement(node)) return false;
   const openingElement = node.openingElement
   const attribute = openingElement.attributes[0]
   return openingElement.name.name === 'Slot' && attribute && attribute.name.name !== 'provide'
}

function transformToNamedSlots(childPaths) {
   return t.jsxExpressionContainer(t.objectExpression(createNamedSlotProperties(childPaths)))
}

function isProvider(node) {
   if (!t.isJSXElement(node)) return false;
   const openingElement = node.openingElement
   const attributes = openingElement.attributes
   for (const attribute of attributes) {
      if (attribute.name.name === 'provide') return true;
   }
   return false;
}

function createNamedSlotProperties(childPaths) {
   const defaultSlotChildren = [];
   const namedSlotProperties = [];
   let defaultNode;
   for (const path of childPaths) {
      const node = path.node

      if (isDefaultSlot(node)) {
         if (!defaultNode) defaultNode = node
         defaultSlotChildren.push(...path.get('children'))
      }
      else if (isNamedSlot(node)) {
         namedSlotProperties.push(
            t.objectProperty(
               t.identifier(getSlotName(node)),
               wrapIfProvides(t.arrowFunctionExpression(
                  [],
                  transformJSXChildrenToArrayExpression(path.get('children'))
               ), node)
            ))
      }
      else {
         defaultSlotChildren.push(path)
      }
   }
   if (defaultSlotChildren.length) {
      namedSlotProperties.push(
         t.objectProperty(
            t.identifier('Default'),
            wrapIfProvides(t.arrowFunctionExpression(
               [],
               transformJSXChildrenToArrayExpression(defaultSlotChildren)
            ), defaultNode)
         )
      )
   }
   return namedSlotProperties
}

function wrapIfProvides(renderfunction, node) {
   if (!node) return renderfunction;
   const provided = getProvided(node)
   if (provided) {
      return t.callExpression(t.identifier('_$$wrapWithCommons'), [renderfunction, provided])
   }
   return renderfunction
}

function getProvided(node) {
   const attributes = node.openingElement.attributes
   for (const attribute of attributes) {
      if (attribute.name.name === 'provide') {
         const value = attribute.value
         if (t.isJSXExpressionContainer(value)) {
            return value.expression
         }
         return undefined;
      }
   }
   return undefined;
}

function getSlotName(node) {
   const name = node.openingElement.attributes[0].name.name;
   return name;
}

function isDefaultSlot(node) {
   if (!t.isJSXElement(node)) return false;
   const openingElement = node.openingElement
   const attribute = openingElement.attributes[0]
   console.log('attribute', attribute)
   return openingElement.name.name === 'Slot' && (attribute === undefined) || (attribute.name.name === 'provide')
}


/*
Component with Slot:

   <ButtonWithTooltip>
      Hover over me (tooltip below
      <Slot tooltip>
         <div>
         </div>
      </Slot>
   </ButtonWithTooltip>

transforms to:

   jsxDEV(ButtonWithTooltip, {
      children: {
         default: () => ["Hover over me (tooltip below)"],
         tooltip: () => [
            jsxDEV("div", {})
         ]
      }
   }),
*/


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
         transformIfDerivationShorthand(element)
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
         transformIfDerivationShorthand(value)
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
   if (t.isSequenceExpression(node)) {
      return normalizeToArrayExpression(node.expressions.at(-1))
   }
   const arrayExpression = t.arrayExpression([node])
   arrayExpression.visited = true;
   return arrayExpression
}

// function isDerivation(path) {
//    const node = path.node;
//    if (!node || !t.isExpression(node))
//       return false;
//    if (t.isArrowFunctionExpression(node)
//       || t.isFunctionExpression(node)
//       || t.isObjectExpression(node)
//       || t.isArrayExpression(node)
//       || t.isIdentifier(node)
//       || t.isCallExpression(node) && isTemplateFunction(node.callee.name)) {
//       return false;
//    }
//    if (hasIonicCallExpression(path)) {
//       return true;
//    }
//    return false;
// }

// function hasIonicCallExpression(path) {
//    if (isIonicCallExpression(path.node))
//       return true;
//    let found = false;
//    path.traverse({
//       CallExpression(path) {
//          if (isIonicCallExpression(path.node)) {
//             found = true;
//             path.stop()
//          }
//       }
//    })
//    return found;
// }


// function isIonicCallExpression(node) {
//    return t.isCallExpression(node) && /^\$[a-z]/.test(node.callee.name) && node.arguments.length === 0 && !isParenthesized(node)
// }

function isParenthesized(node) {
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
