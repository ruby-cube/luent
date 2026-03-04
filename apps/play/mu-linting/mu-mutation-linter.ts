import * as ts from "typescript"

export type MuLintIssue = {
   filePath: string
   line: number
   column: number
   code: string
   message: string
}

type ComponentInfo = {
   node: ts.FunctionLikeDeclaration
   muObjectSymbols: Set<ts.Symbol>
   muDestructuredSymbols: Set<ts.Symbol>
}

export function lintMuMutationFile(filePath: string, program?: ts.Program): MuLintIssue[] {
   const internalProgram =
      program ??
      ts.createProgram({
         rootNames: [filePath],
         options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            jsx: ts.JsxEmit.ReactJSX,
            strict: true,
         },
      })

   return lintMuMutationProgram(internalProgram, (sourceFile) => sourceFile.fileName === filePath)
}

export function lintMuMutationProgram(
   program: ts.Program,
   includeSourceFile: (sourceFile: ts.SourceFile) => boolean = () => true
): MuLintIssue[] {
   const checker = program.getTypeChecker()
   const issues: MuLintIssue[] = []

   const sourceFiles = program
      .getSourceFiles()
      .filter((sourceFile) => !sourceFile.isDeclarationFile)
      .filter(includeSourceFile)

   const mutatingMethodSymbols = collectMutatingMethodSymbols(sourceFiles, checker)

   for (const sourceFile of sourceFiles) {
      const componentInfos = collectComponentInfos(sourceFile, checker)
      const componentNodes = new Set(componentInfos.keys())

      const functionStack: ts.FunctionLikeDeclaration[] = []

      const visit = (node: ts.Node) => {
         if (isFunctionLike(node)) {
            functionStack.push(node)
            ts.forEachChild(node, visit)
            functionStack.pop()
            return
         }

         const nearestFunction = functionStack.at(-1)
         if (nearestFunction) {
            const componentRoot = findNearestComponent(functionStack, componentNodes)
            const componentInfo = componentRoot ? componentInfos.get(componentRoot) : undefined
            const analysisRoot = componentRoot ?? nearestFunction

            if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
               checkMutationTarget(
                  node.left,
                  {
                     checker,
                     analysisRoot,
                     componentInfo,
                     issues,
                  },
                  node.left
               )
            }

            if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
               if (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) {
                  checkMutationTarget(
                     node.operand,
                     {
                        checker,
                        analysisRoot,
                        componentInfo,
                        issues,
                     },
                     node.operand
                  )
               }
            }

            if (ts.isDeleteExpression(node)) {
               checkMutationTarget(
                  node.expression,
                  {
                     checker,
                     analysisRoot,
                     componentInfo,
                     issues,
                  },
                  node.expression
               )
            }

            if (ts.isCallExpression(node)) {
               const mutatingCallTarget = getMutatingCallTarget(node, checker, mutatingMethodSymbols)
               if (mutatingCallTarget) {
                  checkMutationTarget(
                     mutatingCallTarget,
                     {
                        checker,
                        analysisRoot,
                        componentInfo,
                        issues,
                        isMethodCall: true,
                     },
                     node
                  )
               }
            }
         }

         ts.forEachChild(node, visit)
      }

      visit(sourceFile)
   }

   return issues
}

function collectComponentInfos(sourceFile: ts.SourceFile, checker: ts.TypeChecker): Map<ts.FunctionLikeDeclaration, ComponentInfo> {
   const componentInfos = new Map<ts.FunctionLikeDeclaration, ComponentInfo>()

   const visit = (node: ts.Node) => {
      if (isFunctionLike(node) && isComponentFunction(node)) {
         const info: ComponentInfo = {
            node,
            muObjectSymbols: new Set<ts.Symbol>(),
            muDestructuredSymbols: new Set<ts.Symbol>(),
         }

         for (const parameter of node.parameters) {
            collectMuBindingsFromParamName(parameter.name, checker, info)
         }

         if (node.body && ts.isBlock(node.body)) {
            collectMuDestructureInBody(node.body, checker, info)
         }

         componentInfos.set(node, info)
      }

      ts.forEachChild(node, visit)
   }

   visit(sourceFile)
   return componentInfos
}

function collectMutatingMethodSymbols(sourceFiles: ts.SourceFile[], checker: ts.TypeChecker): Set<string> {
   const mutatingSymbols = new Set<string>()
   const candidateMethods: ts.MethodDeclaration[] = []

   const visit = (node: ts.Node) => {
      if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
         const symbol = node.name ? checker.getSymbolAtLocation(node.name) : undefined
         if (symbol && hasMuThisParameter(node, checker)) {
            mutatingSymbols.add(getSymbolKey(symbol, checker))
         }

         if (ts.isMethodDeclaration(node) && node.body && symbol) {
            candidateMethods.push(node)
         }
      }

      if (ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) {
         if (!node.type || !ts.isFunctionTypeNode(node.type) || !node.name) {
            ts.forEachChild(node, visit)
            return
         }

         const symbol = checker.getSymbolAtLocation(node.name)
         if (symbol && hasMuThisParameter(node.type, checker)) {
            mutatingSymbols.add(getSymbolKey(symbol, checker))
         }
      }

      ts.forEachChild(node, visit)
   }

   for (const sourceFile of sourceFiles) {
      visit(sourceFile)
   }

   let changed = true
   while (changed) {
      changed = false

      for (const methodNode of candidateMethods) {
         const symbol = methodNode.name ? checker.getSymbolAtLocation(methodNode.name) : undefined
         if (!symbol || !methodNode.body) continue

         const symbolKey = getSymbolKey(symbol, checker)
         if (mutatingSymbols.has(symbolKey)) continue

         if (methodMutatesThis(methodNode.body, checker, mutatingSymbols)) {
            mutatingSymbols.add(symbolKey)
            changed = true
         }
      }
   }

   return mutatingSymbols
}

function methodMutatesThis(body: ts.Block, checker: ts.TypeChecker, mutatingSymbols: Set<string>): boolean {
   let mutates = false

   const visit = (node: ts.Node) => {
      if (mutates) return

      if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
         if (isThisMutationTarget(node.left)) {
            mutates = true
            return
         }
      }

      if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
         if (
            (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) &&
            isThisMutationTarget(node.operand)
         ) {
            mutates = true
            return
         }
      }

      if (ts.isDeleteExpression(node) && isThisMutationTarget(node.expression)) {
         mutates = true
         return
      }

      if (ts.isCallExpression(node)) {
         const target = getMutatingCallTarget(node, checker, mutatingSymbols, false)
         if (target && expressionIsThisOrThisProperty(target)) {
            mutates = true
            return
         }
      }

      ts.forEachChild(node, visit)
   }

   visit(body)
   return mutates
}

function checkMutationTarget(
   targetExpression: ts.Expression,
   context: {
      checker: ts.TypeChecker
      analysisRoot: ts.FunctionLikeDeclaration
      componentInfo?: ComponentInfo
      issues: MuLintIssue[]
      isMethodCall?: boolean
   },
   reportNode: ts.Node
) {
   const isPropertyLikeTarget = ts.isPropertyAccessExpression(targetExpression) || ts.isElementAccessExpression(targetExpression)
   if (!isPropertyLikeTarget && !context.isMethodCall) {
      return
   }

   const rootExpression = isPropertyLikeTarget ? getRootExpression(targetExpression) : targetExpression
   if (!rootExpression || rootExpression.kind === ts.SyntaxKind.ThisKeyword || rootExpression.kind === ts.SyntaxKind.SuperKeyword) {
      return
   }

   const rootSymbol = context.checker.getSymbolAtLocation(rootExpression)
   if (!rootSymbol) return

   if (isLocalSymbol(rootSymbol, context.analysisRoot, context.checker)) {
      return
   }

   if (context.componentInfo) {
      if (expressionStartsWithMuObject(targetExpression, context.componentInfo.muObjectSymbols, context.checker)) {
         return
      }

      const aliasedRoot = getAliasedSymbolIfNeeded(rootSymbol, context.checker)
      if (context.componentInfo.muDestructuredSymbols.has(aliasedRoot)) {
         return
      }

      addIssue(
         context.issues,
         reportNode,
         "MU001",
         context.isMethodCall
            ? "Mutating method call is only allowed on objects from component `mu` props (direct or destructured)."
            : "Object mutation is only allowed on objects from component `mu` props (direct or destructured)."
      )
      return
   }

   const rootType = context.checker.getTypeAtLocation(rootExpression)
   if (isMuLikeType(rootType, context.checker)) {
      return
   }

   addIssue(
      context.issues,
      reportNode,
      "MU002",
      context.isMethodCall
         ? "Mutating method call is only allowed on objects typed as `Mu<...>` outside components."
         : "Object mutation is only allowed on objects typed as `Mu<...>` outside components."
   )
}

function getMutatingCallTarget(
   node: ts.CallExpression,
   checker: ts.TypeChecker,
   mutatingMethodSymbols: Set<string>,
   allowBodyInference: boolean = true
): ts.Expression | undefined {
   if (!ts.isPropertyAccessExpression(node.expression) && !ts.isElementAccessExpression(node.expression)) {
      return undefined
   }

   const signature = checker.getResolvedSignature(node)
   if (signature && signatureHasMuThis(signature, checker, node)) {
      return node.expression.expression
   }

   const signatureDeclaration = signature?.getDeclaration()
   if (allowBodyInference && signatureDeclaration && ts.isMethodDeclaration(signatureDeclaration) && signatureDeclaration.body) {
      if (methodMutatesThis(signatureDeclaration.body, checker, mutatingMethodSymbols)) {
         return node.expression.expression
      }
   }

   const methodNameNode =
      ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression.argumentExpression

   if (!methodNameNode) return undefined
   const symbol = checker.getSymbolAtLocation(methodNameNode)
   if (!symbol) return undefined

   return mutatingMethodSymbols.has(getSymbolKey(symbol, checker)) ? node.expression.expression : undefined
}

function signatureHasMuThis(signature: ts.Signature, checker: ts.TypeChecker, location: ts.Node): boolean {
   const thisParameter = (signature as ts.Signature & { thisParameter?: ts.Symbol }).thisParameter
   if (thisParameter) {
      const thisType = checker.getTypeOfSymbolAtLocation(thisParameter, location)
      if (isMuLikeType(thisType, checker)) return true
   }

   const declaration = signature.getDeclaration()
   return declaration ? hasMuThisParameter(declaration, checker) : false
}

function hasMuThisParameter(node: ts.SignatureDeclarationBase, checker: ts.TypeChecker): boolean {
   const thisParam = node.parameters.find((parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === "this")
   if (!thisParam || !thisParam.type) return false
   const thisType = checker.getTypeFromTypeNode(thisParam.type)
   return isMuLikeType(thisType, checker)
}

function isThisMutationTarget(node: ts.Expression): boolean {
   if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) {
      return false
   }
   const root = getRootExpression(node)
   return root ? root.kind === ts.SyntaxKind.ThisKeyword : false
}

function expressionIsThisOrThisProperty(node: ts.Expression): boolean {
   if (node.kind === ts.SyntaxKind.ThisKeyword) return true
   if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const root = getRootExpression(node)
      return root ? root.kind === ts.SyntaxKind.ThisKeyword : false
   }
   return false
}

function collectMuBindingsFromParamName(name: ts.BindingName, checker: ts.TypeChecker, info: ComponentInfo) {
   if (!ts.isObjectBindingPattern(name)) return

   for (const element of name.elements) {
      if (!element.propertyName && ts.isIdentifier(element.name) && element.name.text === "mu") {
         const muSymbol = checker.getSymbolAtLocation(element.name)
         if (muSymbol) info.muObjectSymbols.add(getAliasedSymbolIfNeeded(muSymbol, checker))
         continue
      }

      if (element.propertyName && ts.isIdentifier(element.propertyName) && element.propertyName.text === "mu") {
         if (ts.isIdentifier(element.name)) {
            const muSymbol = checker.getSymbolAtLocation(element.name)
            if (muSymbol) info.muObjectSymbols.add(getAliasedSymbolIfNeeded(muSymbol, checker))
            continue
         }

         collectBoundIdentifiers(element.name, checker, info.muDestructuredSymbols)
      }
   }
}

function collectMuDestructureInBody(block: ts.Block, checker: ts.TypeChecker, info: ComponentInfo) {
   const visit = (node: ts.Node) => {
      if (ts.isFunctionLike(node)) return

      if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && node.initializer) {
         if (expressionStartsWithMuObject(node.initializer, info.muObjectSymbols, checker)) {
            collectBoundIdentifiers(node.name, checker, info.muDestructuredSymbols)
         }
      }

      ts.forEachChild(node, visit)
   }

   visit(block)
}

function collectBoundIdentifiers(node: ts.BindingName, checker: ts.TypeChecker, output: Set<ts.Symbol>) {
   if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node)
      if (symbol) output.add(getAliasedSymbolIfNeeded(symbol, checker))
      return
   }

   for (const element of node.elements) {
      if (!ts.isBindingElement(element)) continue
      collectBoundIdentifiers(element.name, checker, output)
   }
}

function isComponentFunction(node: ts.FunctionLikeDeclaration): boolean {
   if (!node.body) return false

   if (ts.isBlock(node.body)) {
      let found = false

      const visit = (child: ts.Node) => {
         if (found) return
         if (isFunctionLike(child)) return

         if (ts.isReturnStatement(child) && child.expression && isTemplateCall(child.expression)) {
            found = true
            return
         }

         ts.forEachChild(child, visit)
      }

      visit(node.body)
      return found
   }

   return isTemplateCall(node.body)
}

function isTemplateCall(expression: ts.Expression): boolean {
   return (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === "template"
   )
}

function expressionStartsWithMuObject(
   expression: ts.Expression,
   muObjectSymbols: Set<ts.Symbol>,
   checker: ts.TypeChecker
): boolean {
   const root = getRootExpression(expression)
   if (!root || !ts.isIdentifier(root)) return false

   const symbol = checker.getSymbolAtLocation(root)
   if (!symbol) return false

   return muObjectSymbols.has(getAliasedSymbolIfNeeded(symbol, checker))
}

function getRootExpression(expression: ts.Expression): ts.Expression | undefined {
   let current: ts.Expression = expression
   while (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) {
      current = current.expression
   }

   return current
}

function isLocalSymbol(symbol: ts.Symbol, analysisRoot: ts.FunctionLikeDeclaration, checker: ts.TypeChecker): boolean {
   const unaliased = getAliasedSymbolIfNeeded(symbol, checker)
   const decls = unaliased.declarations ?? []

   for (const declaration of decls) {
      if (isParameterOrParameterBinding(declaration)) continue
      if (declaration.getSourceFile() !== analysisRoot.getSourceFile()) continue
      if (declaration.pos >= analysisRoot.pos && declaration.end <= analysisRoot.end) {
         return true
      }
   }

   return false
}

function isParameterOrParameterBinding(node: ts.Declaration): boolean {
   if (ts.isParameter(node)) return true
   if (!ts.isBindingElement(node)) return false

   let current: ts.Node | undefined = node.parent
   while (current) {
      if (ts.isParameter(current)) return true
      if (ts.isFunctionLike(current) || ts.isSourceFile(current)) break
      current = current.parent
   }

   return false
}

function getAliasedSymbolIfNeeded(symbol: ts.Symbol, checker?: ts.TypeChecker): ts.Symbol {
   if (!checker) return symbol
   if (symbol.flags & ts.SymbolFlags.Alias) {
      return checker.getAliasedSymbol(symbol)
   }
   return symbol
}

function getSymbolKey(symbol: ts.Symbol, checker: ts.TypeChecker): string {
   const unaliased = getAliasedSymbolIfNeeded(symbol, checker)
   const declaration = unaliased.declarations?.[0]
   const declarationKey = declaration
      ? `${declaration.getSourceFile().fileName}:${declaration.pos}:${declaration.end}`
      : "no-declaration"

   return `${unaliased.getName()}@${declarationKey}`
}

function isMuLikeType(type: ts.Type, checker: ts.TypeChecker): boolean {
   if (type.aliasSymbol?.name === "Mu") return true

   if (type.isUnionOrIntersection()) {
      return type.types.some((inner) => isMuLikeType(inner, checker))
   }

   const mutableFlag = type.getProperty("~mutable")
   if (mutableFlag) return true

   if (type.getFlags() & ts.TypeFlags.Object) {
      const objectType = type as ts.ObjectType
      if (
         objectType.objectFlags & ts.ObjectFlags.Class ||
         objectType.objectFlags & ts.ObjectFlags.Interface
      ) {
         for (const baseType of checker.getBaseTypes(objectType as ts.InterfaceType)) {
            if (isMuLikeType(baseType, checker)) {
               return true
            }
         }
      }
   }

   return false
}

function isAssignmentOperator(operator: ts.SyntaxKind): boolean {
   return (
      operator === ts.SyntaxKind.EqualsToken ||
      operator === ts.SyntaxKind.PlusEqualsToken ||
      operator === ts.SyntaxKind.MinusEqualsToken ||
      operator === ts.SyntaxKind.AsteriskEqualsToken ||
      operator === ts.SyntaxKind.SlashEqualsToken ||
      operator === ts.SyntaxKind.PercentEqualsToken ||
      operator === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
      operator === ts.SyntaxKind.LessThanLessThanEqualsToken ||
      operator === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
      operator === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
      operator === ts.SyntaxKind.AmpersandEqualsToken ||
      operator === ts.SyntaxKind.BarEqualsToken ||
      operator === ts.SyntaxKind.CaretEqualsToken ||
      operator === ts.SyntaxKind.BarBarEqualsToken ||
      operator === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
      operator === ts.SyntaxKind.QuestionQuestionEqualsToken
   )
}

function findNearestComponent(
   functionStack: ts.FunctionLikeDeclaration[],
   componentNodes: Set<ts.FunctionLikeDeclaration>
): ts.FunctionLikeDeclaration | undefined {
   for (let index = functionStack.length - 1; index >= 0; index--) {
      const fn = functionStack[index]
      if (componentNodes.has(fn)) return fn
   }
   return undefined
}

function addIssue(issues: MuLintIssue[], node: ts.Node, code: string, message: string) {
   const sourceFile = node.getSourceFile()
   const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart())

   issues.push({
      filePath: sourceFile.fileName,
      line: line + 1,
      column: character + 1,
      code,
      message,
   })
}

function isFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclaration {
   return (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node) ||
      ts.isConstructorDeclaration(node)
   )
}
