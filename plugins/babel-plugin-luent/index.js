let t; // TODO: import from @babel/types


// TSC PLUGIN: for transforms that impact type-checking, linting, syntax highlighting
// - derivation shorthand
// - async shorthand

// BABEL PLUGIN: for transforms that don't impact type-checking and linting
// - X derivation shorthand
// - X async shorthand
// - dynamic template render function
// - template series
// - slot to render function
// + namespaced objects 


function luentPreTransform({ types }) {
   console.log('luent pre transform')
   t = types;

   return {
      name: "luent-pre-transform",
      visitor: {
         CallExpression: {
            enter(path) {
               transformTemplateCallExpressions(path)
            }
         },
         JSXFragment: {
            enter(path) {
               transformLiterals(path) // derivation shorthand
               transformTemplateCallExpressions(path) // derivation shorthand & last arg to render function
               transformJSXFragment(path) // derivation shorthand + async shorthand + transform series
            }
         },
         JSXElement: {
            enter(path) {
               transformLiterals(path) // for derivation shorthand
               transformTemplateCallExpressions(path)
               transformJSXElement(path) // slot to render function
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

function isAsSeriesElement(node, seriesType) {
   return t.isCallExpression(node) && (node.callee.name === 'As' || node.callee.name === 'Default' && seriesType === 'As')
}

function isAwaitSeriesElement(node, seriesType) {
   return t.isCallExpression(node) && (
      node.callee.name === 'Await'
      || node.callee.name === 'Meanwhile'
      || node.callee.name === 'Nonce'
      || node.callee.name === 'Catch' && seriesType === 'Await'
   )
}


function createIfSeries(series) {
   return t.callExpression(t.identifier('_$$IfSeries'), [t.arrayExpression(series)])
}

function createTrySeries(series) {
   return t.callExpression(t.identifier('_$$TrySeries'), series)
}

function createAsSeries(series) {
   return t.callExpression(t.identifier('_$$AsSeries'), series)
}

function createAwaitSeries(series) {
   return t.callExpression(t.identifier('_$$AwaitSeries'), [t.arrayExpression(series)])
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



// TODO: 
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
  //  transformJSXChildren(children)
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

            case 'As':
               array.push(createAsSeries(series)) // TODO:
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
      else if (t.isJSXExpressionContainer(node) && isAsSeriesElement(node.expression, seriesType)) {
         if (node.expression.callee.name === 'As') {
            closeSeries()
            seriesType = 'As'
            series = [node.expression]
         }
         else if (node.expression.callee.name === 'Default') {
            series.push(node.expression)
            closeSeries()
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
   // if (slotIsRenderFunction(paths)) return paths[0].node; // TODO: still need to transform return of renderfunction if is derivation 
   return transformChildrenToRenderFunction(paths)
}

function transformChildrenToRenderFunction(paths) {
   return t.jsxExpressionContainer(
      t.arrowFunctionExpression(
         [],
         transformJSXChildrenToArrayExpression(paths)
      ));
}

// function transformJSXChildren(childrenPath) {
//    for (let i = 0; i < childrenPath.length; i++) {
//       const child = childrenPath[i]
//       if (t.isJSXExpressionContainer(child.node) && !t.isJSXEmptyExpression(child.node.expression)) {
//          transformIfDerivationShorthand(child.get('expression'))
//       }
//    }
//    return childrenPath;
// }

function isAsyncIonShorthand(node) {
   return t.isCallExpression(node) && t.isMemberExpression(node.callee) && node.callee.object.name === 'o' && node.callee.property.name === 'await'
}

function toAsyncIon(node) {
   return t.callExpression(t.identifier('$$_createAsyncIon'), [t.arrowFunctionExpression([], t.blockStatement([
      t.returnStatement(node) // Return the original expression
   ]))])
}

// function transformIfDerivationShorthand(path) {
//    if (!path || !path.node) return;
//    const node = path.node
//    if (isDerivationShorthand(node)) {
//       if (isAsyncIonShorthand(node)) {
//          path.replaceWith(toAsyncIon(node))
//       }
//       else {
//          path.replaceWith(toDerivationFunction(node))
//       }
//       // transformLiterals(path.get('right'))
//    }
//    // else if (isDerivation(path)) {
//    //    // console.log('isDerivation', path.node)
//    //    // transformLiterals(path)
//    //    path.replaceWith(toDerivationFunction(path.node))
//    // }
// }

function transformLiterals(path) {
   path.traverse({
      ObjectExpression(path) {
         if (path.visited || path.node.visited) {
            return;
         }
         path.visited = true;
         transformObjectProperties(path.get('properties'))
      },
      ArrayExpression(path) {
         if (path.visited || path.node.visited) {
            return;
         }
         path.visited = true;
         transformArrayElements(path.get('elements'))
      }
   })
}

// function isDerivationShorthand(node) {
//    return isParenthesized(node) && !t.isIdentifier(node);
// }




// function slotIsRenderFunction(paths) {
//    // if (paths.length !== 1) return false;
//    const child = paths[0].node;
//    if (!t.isJSXExpressionContainer(child)) return false;
//    const expression = child.expression
//    if (t.isArrowFunctionExpression(expression))
//       // || t.isFunctionExpression(expression) && !expression.id.name.startsWith('$drv'))
//       return true;
//    return false;
// }

// function isJSXRoot(node) {
//    return t.isJSXFragment(node) || t.isJSXElement(node)
// }




const TemplateFunctions = {
   If: transformIfCall,
   ElseIf: transformIfCall,
   Else: transformTemplateArgToRenderFunction,
   Try: transformTemplateArgToRenderFunction,
   Await: transformTemplateArgToRenderFunction,
   Meanwhile: transformTemplateArgToRenderFunction,
   For: transformTemplateArgToRenderFunction,
   Portal: transformTemplateArgToRenderFunction,
   Default: transformTemplateArgToRenderFunction,
   As: transformTemplateArgToRenderFunction,
   Case: (path) => {
      // transformIfDerivationShorthand(path.get('arguments.0'));
      if (path.node.arguments.length > 1)
         transformTemplateArgToRenderFunction(path)
   }
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

function transformIfCall(path) {
  //  transformIfDerivationShorthand(path.get('arguments.0'))
   transformTemplateArgToRenderFunction(path)
}


function transformTemplateArgToRenderFunction(path) {
   const args = path.node.arguments
   const lastIndex = args.length - 1;
   const templateArg = args[lastIndex]
   if (!t.isArrowFunctionExpression(templateArg)
      // t.isCallExpression(templateArg) && isTemplateFunction(templateArg.callee.name)
      // || templateArg && isJSXRoot(templateArg)
      // || t.isSequenceExpression(templateArg)
   ) {
      args[lastIndex] = toRenderFunction(templateArg)
   }
}

// let derivationCount = 0;

function toDerivationFunction(node) {
   // return t.arrowFunctionExpression([], t.blockStatement([
   //    t.returnStatement(node) // Return the original expression
   // ]))
   return t.arrowFunctionExpression([], t.blockStatement([
      t.returnStatement(node) // Return the original expression
   ]))
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
      const namespaceName = node.name && node.name.namespace && node.name.namespace.name
      const value = node.value;
      if (!t.isJSXExpressionContainer(value)) continue;
      // if (t.isObjectExpression(value.expression)) {
      //    transformObjectProperties(attribute.get('value.expression.properties'))
      // }
      // else if (t.isArrayExpression(value.expression)) {
      //    transformArrayElements(attribute.get('value.expression.elements'))
      // }
      // if (namespaceName !== 'on' && namespaceName !== 'mu' && namespaceName !== 'Slot') {
      //    transformIfDerivationShorthand(attribute.get('value.expression'))
      // }
      // else {
      //    transformIfSlotShorthand(attribute.get('value.expression')) // TODO: slot shorthand is same as derivation shorthand
      // }
   }
}


// function transformIfSlotShorthand(path) {
//    if (!path || !path.node) return;
//    const node = path.node
//    if (isDerivationShorthand(node)) {
//       path.replaceWith(toArrowFunction(node))
//    }
// }

function toArrowFunction(node) {
   return t.arrowFunctionExpression([], t.blockStatement([
      t.returnStatement(node) // Return the original expression
   ]))
}


function transformJSXSlot(path) {
   const children = path.get('children')
   if (children.length === 0) return;
  //  transformJSXChildren(children)
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
      // else {
      //    transformIfDerivationShorthand(element)
      // }
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
      // else {
      //    transformIfDerivationShorthand(value)
      // }
   }
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


function isParenthesized(node) {
   return 'extra' in node && node.extra.parenthesized === true;
}

export {
   luentPreTransform
}