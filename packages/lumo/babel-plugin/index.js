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
   return isParenthesized(node);
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
   if (t.isArrowFunctionExpression(expression)
      || t.isFunctionExpression(expression) && !expression.id.name.startsWith('$drv'))
      return true;
   return false;
}

function isJSXRoot(node) {
   return t.isJSXFragment(node) || t.isJSXElement(node)
}




const TemplateFunctions = {
   If: transformIfCall,
   ElseIf: transformIfCall,
   Else: transformElseCall,
   Try: transformElseCall,
   Await: transformElseCall,
   Meanwhile: transformElseCall,
   For: transformElseCall,
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

function transformWatchSubject(path) {
   const args = path.node.arguments;
   if (args.length > 0 && isDerivationShorthand(path.get('arguments')[0])) {
      args[0] = toDerivationFunction(args[0]);
      path.node.arguments = args;
   }
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
      || templateArg && isJSXRoot(templateArg)
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
