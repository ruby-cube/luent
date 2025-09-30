
function isStateRefName(str) {
   return str.startsWith('$')
}

function isAssignee(path) {
   return t.isVariableDeclarator(path.parent) && path.node === path.parent.id
}

function isCallee(path) {
   return path.node === path.parent.callee
}

function isReassignee(path) {
   return (t.isAssignmentExpression(path.parent) && path.node === path.parent.left) || t.isUpdateExpression(path.parent) && path.node === path.parent.argument
}

function isMemberExpressionProperty(path) {
   return (t.isMemberExpression(path.parent) || t.isOptionalMemberExpression(path.parent)) && path.node === path.parent.property
}

function isPropertyKey(path) {
   return t.isObjectProperty(path.parent) && path.node === path.parent.key
}

function isDestructuredAlias(path) {
   return t.isObjectPattern(path.parentPath.parent) && path.node === path.parent.value
}

function isInImportDeclaration(path) {
   return t.isImportDeclaration(path.parentPath.parent)
}


function isInFunctionDef(path) {
   return t.isArrowFunctionExpression(path.parent) || t.isFunctionDeclaration(path.parent) || t.isFunctionExpression(path.parent) || t.isClassExpression(path.parent) || t.isClassDeclaration(path.parent) || t.isClassMethod(path.parent) || path.parent.type === 'TSParameterProperty'
}

function transformIdentifier(path) {
   if (!isStateRefName(path.node.name)
      || isParenthesized(path.node)
      || isAssignee(path)
      || isPropertyKey(path)
      || isDestructuredAlias(path)
      || isCallee(path)
      || isInFunctionDef(path)
      || isInImportDeclaration(path)
      || isMemberExpressionProperty(path)) {
      return;
   }
   if (isReassignee(path)) {
      transformReassignee(path)
      return;
   }
   transformStateRef(path)
}

function transformReassignee(path) {
   const objNode = t.identifier(path.node.name)
   const propertyNode = t.identifier('value')
   const node = t.memberExpression(objNode, propertyNode)
   path.replaceWith(node)
   objNode.created = true;
   propertyNode.created = true;
   //TODO: what if it's ambiguous?
}

function transformStateRef(path) {
   path.replaceWith(t.callExpression(path.node, []))
}