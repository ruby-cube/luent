import { traverse, traverseAll } from '@luently/tree-squirl';
function requireFrom(obj, key) {
    const value = obj[key];
    if (value === undefined)
        throw new Error(key.toString() + ' is missing from context');
    return value;
}
class Scope {
    parent;
    // private variables: Set<string>
    absorbedGetters = new Map();
    constructor(parent) {
        this.parent = parent;
        // this.variables = new Set(parent?.variables)
    }
    // addVariable(name: string) {
    //    this.variables.add(name)
    // }
    // has(name: string) {
    //    return this.variables.has(name)
    // }
    addAbsorbedGetter(name, declaration) {
        console.log('add', name);
        this.absorbedGetters.set(name, declaration);
    }
    getAbsorbedGetterDeclaration(name) {
        const variable = name.endsWith(ACCESSOR_VARIABLE_POSTFIX) ? name.slice(0, -1) : name;
        let scope = this;
        while (scope) {
            const result = scope.absorbedGetters.get(variable);
            if (result) {
                return result;
            }
            scope = scope.parent;
        }
        return undefined;
    }
    typeGuarded = new Set();
    markTypeGuarded(name) {
        this.typeGuarded.add(name);
    }
    isTypeGuarded(name) {
        return this.typeGuarded.has(name);
    }
}
export function transformNSX(ast, edits) {
    let offset = 0;
    edits.lastIndex = 0;
    // Offset adjustment
    traverseAll(ast, { edits }, {
        visit(node, { edits }) {
            node.start = node.start - offset;
            node.end = node.end - offset;
            edits.at(node.start, edit => {
                if (edit.offsetReversed)
                    return;
                offset += edit.offset;
                edit.offsetReversed = true;
            });
            this.visitChildren(node);
        }
    });
    edits.lastIndex = 0;
    return traverse(ast, { edits, createScope: (parent) => new Scope(parent) }, {
        Program(node, context) {
            this.visitEach(node.body, { ...context, program: node });
        },
        VariableDeclaration(node, context) {
            const { edits } = context;
            let isGetKeywordDeclaration = false;
            if (node.kind == 'let') {
                edits.at(node.start, () => {
                    isGetKeywordDeclaration = true;
                });
            }
            const declarator = node.declarations[0];
            const { id, init } = declarator;
            // declarator.init must be visited before id
            node.declarations.forEach(declarator => {
                if (declarator.init)
                    this.visit(declarator.init);
            });
            if (isGetKeywordDeclaration) {
                const program = requireFrom(context, 'program');
                if (node.declarations.length !== 1) {
                    return; // TODO: throw compile error
                }
                if (!init) {
                    return; // TODO: throw compile error
                }
                /**
                 * source: get variable = expression
                 * prepro: let variable = expression
                 * final: const variable = assertª(expression)
                 */
                if (id.type === 'Identifier') {
                    this.willMutate(() => {
                        importFromRuescript('assertª', program);
                        node.kind = 'const';
                        declarator.init = CovertCallExpression('assertª', [init]);
                    });
                    const variable = undoAccessorVariablePostfix(id, this, edits);
                    this.scope.addAbsorbedGetter(variable, node);
                }
                /**
                * source: get [a, b] = expression
                * prepro: let [a, b] = expression
                * final: const [a, b] = destructureªª(expression, [1, 1])
                *
                * source: get { a, b } = expression
                * final: const { a, b } = destructureªª(expression, { a: 1, b: 1 })
                *
                * source: get { a, b: { foo }} = expression
                * final: const { a, b: { foo }} = destructureªª(expression, { a: 1, b: { foo: 1 } })
                *
                * source: get [a = () => 0, b] = expression
                * final: const [a = assertª(() => 0), b] = destructureªª(expression, [1, 1])
                */
                else if (id.type === 'ObjectPattern' || id.type === 'ArrayPattern') {
                    declareAbsorbedGettersFromGetDestructuring(id, node, this, edits, context);
                    this.willMutate(() => {
                        const program = requireFrom(context, 'program');
                        importFromRuescript('destructureªª', program);
                        node.kind = 'const';
                        declarator.init = CovertCallExpression('destructureªª', [
                            init, id.type === 'ObjectPattern'
                                ? ObjectDestructuringMapFromGetKeyword(id)
                                : ArrayDestructuringMapFromGetKeyword(id)
                        ]);
                    });
                }
                else {
                    throw new InternalError('uncovered case');
                }
            }
            /**
             * source: const { foo@, bar } = obj
             * prepro: const { fooª, bar } = obj
             * final: const { foo, bar } = destructureªª(obj, { foo: 1, bar: 0 })
             */
            else if (init && isAccessorPostfixDestructuring(declarator)) {
                if (node.declarations.length !== 1) {
                    return; // TODO: throw compile error
                }
                if (id.type !== 'ObjectPattern' && id.type !== 'ArrayPattern') {
                    return;
                }
                this.willMutate(() => {
                    const program = requireFrom(context, 'program');
                    importFromRuescript('destructureªª', program);
                    const transformName = (name) => name.endsWith(ACCESSOR_VARIABLE_POSTFIX) ? name.slice(0, -1) : name;
                    const deriveValue = (name) => name.endsWith(ACCESSOR_VARIABLE_POSTFIX) ? CovertNumber(1) : CovertNumber(0);
                    declarator.init = CovertCallExpression('destructureªª', [
                        init, id.type === 'ObjectPattern'
                            ? ObjectDestructuringMapFromGetKeyword(id, transformName, deriveValue)
                            : ArrayDestructuringMapFromGetKeyword(id, transformName, deriveValue)
                    ]);
                });
                declareAbsorbedGettersFromAccessorPostfix(id, node, this, edits, context);
            }
            // this.visitEach(node.declarations)
            node.declarations.forEach(declarator => {
                this.visit(declarator.id);
            });
        },
        // VariableDeclarator(node, context) {
        //    if (node.init) this.visit(node.init)
        //    this.visit(node.id)
        // },
        /**
         * source: { get variable: expression }
         * prepro: { gª, variable: expression }
         * final: absorbsª({ variable: absorbª(expression) })
         */
        ObjectExpression(node, context) {
            const properties = [];
            const edits = [];
            let edit = undefined;
            node.properties.forEach(node => {
                if (node.type === 'Property'
                    && node.key.type === 'Identifier'
                    && node.key.name === 'gª'
                    && node.shorthand === true) {
                    edit = context.edits.find(node.start);
                    if (edit?.type === 'GetPropertyColonNotation') {
                        return; // skip visiting children
                    }
                    else {
                        properties.push(node);
                    }
                }
                else {
                    if (edit) {
                        edits[properties.length] = edit;
                        edit = null;
                    }
                    properties.push(node);
                }
                if (node.type === 'Property' && !node.shorthand) {
                    this.visit(node.key);
                    this.visit(node.value);
                }
                else { // spread and shorthand
                    this.visit(node);
                }
            });
            if (edit !== undefined) {
                const program = requireFrom(context, 'program');
                this.willMutate(() => {
                    importFromRuescript('assertª', program);
                    importFromRuescript('absorbsª', program);
                    importFromRuescript('absorbª', program);
                    properties.forEach((node, index) => {
                        if (edits[index] && node.type === 'Property') {
                            node.value = CovertCallExpression('absorbª', [CovertCallExpression('assertª', [node.value])]);
                        }
                    });
                    node.properties = properties;
                });
                this.willReplace(node, CovertCallExpression('absorbsª', [node]));
            }
        },
        BlockStatement(node, context) {
            const parent = node.parent;
            if (isFunctionNode(parent)) {
                this.visitEach(node.body);
            }
            else {
                this.enterScope();
                this.visitEach(node.body);
                this.exitScope();
            }
        },
        FunctionDeclaration(node, context) {
            scopeFunction(this, node, context);
        },
        FunctionExpression(node, context) {
            scopeFunction(this, node, context);
        },
        ArrowFunctionExpression(node, context) {
            const { edits } = context;
            if (hasAwait(node.body))
                node.async = true;
            const firstParam = node.params[0];
            /**
             * source: { statements }@
             * prepro: (ª=>{ statements })
             * final (() => { statements })
             */
            if (firstParam?.type === 'Identifier' && firstParam.name === 'ª') {
                edits.at(node.body.start, () => {
                    this.willMutate(() => {
                        node.params = [];
                    });
                });
            }
            scopeFunction(this, node, context);
        },
        MemberExpression(node, context) {
            const { edits } = context;
            const { object, property } = node;
            this.visit(object);
            this.visit(property);
            if (!node.computed && property.type === 'Identifier') {
                /**
                 * source: obj.count@
                 * prepro: obj.countª
                 * final: ªªof(obj).count
                 */
                if (property.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
                    edits.at(node.end, () => {
                        const program = requireFrom(context, 'program');
                        this.willMutate(() => {
                            importFromRuescript('ªªof', program);
                            property.name = property.name.slice(0, -1);
                        });
                        this.willReplace(node.object, CovertCallExpression('ªªof', [node.object]));
                    });
                }
            }
        },
        Identifier(leaf, context) {
            const { edits } = context;
            if (isAssignee(leaf) || isPropertyKey(leaf) || leaf.parent?.type === 'LabeledStatement' || leaf.parent?.type === 'TSIndexSignature') {
                // TODO: unwrite invalid edits
                return;
            }
            if (!leaf.name || leaf.name === 'this')
                return;
            if (this.scope.getAbsorbedGetterDeclaration(leaf.name)) {
                console.log('accessor variable:', leaf.name);
                /**
                 * Absorbed getter access
                 * source: count@
                 * prepro: countª
                 * final: count
                */
                if (leaf.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
                    edits.at(leaf.end, () => {
                        this.willMutate(() => {
                            leaf.name = leaf.name.slice(0, -1);
                        });
                    });
                }
                /**
                 * Absorbed getter read
                 * source: count
                 * prepro: count
                 * final: count()
                 */
                else {
                    this.willReplace(leaf, GetterCall(leaf));
                }
            }
            else {
                /**
                 * Absorbed getter access
                 * source: count@
                 * prepro: countª
                 * final: toª(count)
                 */
                if (leaf.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
                    const program = requireFrom(context, 'program');
                    edits.at(leaf.end, () => {
                        this.willMutate(() => {
                            importFromRuescript('toª', program);
                            leaf.name = leaf.name.slice(0, -1);
                        });
                        this.willReplace(leaf, CovertCallExpression('toª', [leaf]));
                    });
                }
            }
        },
        AssignmentExpression(node, context) {
            const left = node.left;
            switch (left.type) {
                case 'Identifier':
                    /**
                     * source: count = expression;
                     * final: assertµ(count).value = expression;
                     */
                    queueAccessorVariableWrite(this, node, 'left', left, context);
                    break;
                case 'ArrayPattern':
                    break;
                case 'MemberExpression':
                    break;
                case 'ObjectPattern':
                    break;
                case 'TSAsExpression':
                    break;
                case 'TSNonNullExpression':
                    break;
                case 'TSSatisfiesExpression':
                    break;
                case 'TSTypeAssertion':
                    break;
                default:
                    break;
            }
            this.visit(node.left);
            this.visit(node.right);
        },
        UpdateExpression(node, context) {
            const arg = node.argument;
            switch (arg.type) {
                case 'Identifier':
                    /**
                     * source: count++;
                     * final: assertµ(count).value++;
                     */
                    queueAccessorVariableWrite(this, node, 'argument', arg, context);
                    break;
                case 'MemberExpression':
                    break;
                case 'TSAsExpression':
                    break;
                case 'TSNonNullExpression':
                    break;
                case 'TSSatisfiesExpression':
                    break;
                case 'TSTypeAssertion':
                    break;
                default:
                    break;
            }
            this.visit(arg);
        },
        CallExpression(node, context) {
            const { edits } = context;
            this.visit(node.callee);
            this.visitEach(node.arguments);
            if (node.callee.type === 'TSNonNullExpression') {
                const nonNullExpression = node.callee;
                edits.at(nonNullExpression.end, () => {
                    /**
                     * IIDE
                     * (expression)@()
                     */
                    const expression = nonNullExpression.expression;
                    this.willReplace(node, {
                        type: 'CallExpression',
                        start: node.start,
                        end: node.end,
                        optional: false,
                        callee: {
                            type: 'ParenthesizedExpression',
                            start: 0,
                            end: 0,
                            expression: DerivationArrowFunctionExpression(expression)
                        },
                        arguments: []
                    });
                });
            }
        },
        TSNonNullExpression(node, context) {
            const { edits } = context;
            this.visit(node.expression);
            edits.at(node.end, edit => {
                const expression = node.expression;
                switch (edit.type) {
                    case 'AccessorExpressionPostfix':
                        /**
                         * source: foo()@
                         * prepro: foo()!
                         * final: toª(foo())
                         */
                        if (expression.type === 'CallExpression') {
                            const program = requireFrom(context, 'program');
                            this.willMutate(() => {
                                importFromRuescript('toª', program);
                            });
                            this.willReplace(node, CovertCallExpression('toª', [expression]));
                        }
                        /**
                         * source: (expression)@
                         * prepro: (expression)!
                         * final: () => expression
                         */
                        else if (expression.type === 'ParenthesizedExpression' || expression.type === 'SequenceExpression') {
                            this.willReplace(node, DerivationArrowFunctionExpression(expression));
                        }
                        break;
                    case 'OptionalAccessorPostfix':
                        /**
                         * source: foo?@
                         * prepro: foo!!
                         * final: toª(foo, "?")
                         *
                         * source: foo()?@
                         * prepro: foo()!!
                         * final: toª(foo(), "?")
                         */
                        if (expression.type === 'TSNonNullExpression') {
                            const exp = expression.expression;
                            if (exp.type === 'Identifier' || exp.type === 'CallExpression') {
                                const program = requireFrom(context, 'program');
                                this.willMutate(() => {
                                    importFromRuescript('toª', program);
                                });
                                this.willReplace(node, CovertCallExpression('toª', [exp, CovertString('?')]));
                            }
                            /**
                            * source: foo.bar?@
                            * prepro: foo.bar!!
                            * final: ªªof(foo, "?").bar)
                            *
                            * source: foo[bar]?@
                            * prepro: foo[bar]!!
                            * final: ªªof(foo, "?")[bar]
                            */
                            else if (exp.type === 'MemberExpression') {
                                const program = requireFrom(context, 'program');
                                this.willMutate(() => {
                                    importFromRuescript('ªªof', program);
                                });
                                this.willReplace(node, {
                                    type: 'MemberExpression',
                                    start: node.start,
                                    end: node.end,
                                    object: CovertCallExpression('ªªof', [exp.object, CovertString('?')]),
                                    property: exp.property,
                                    computed: exp.computed,
                                    optional: false
                                });
                            }
                        }
                        break;
                    case 'NonNullAccessorPostfix':
                        /**
                         * source: foo!@
                         * prepro: foo!!
                         * final: toª(foo, "!")
                         *
                         * source: foo()!@
                         * prepro: foo()!!
                         * final: toª(foo(), "!")
                         */
                        if (expression.type === 'TSNonNullExpression') {
                            const exp = expression.expression;
                            if (exp.type === 'Identifier' || exp.type === 'CallExpression') {
                                const program = requireFrom(context, 'program');
                                this.willMutate(() => {
                                    importFromRuescript('toª', program);
                                });
                                this.willReplace(node, CovertCallExpression('toª', [expression]));
                            }
                            /**
                            * source: foo.bar!@
                            * prepro: foo.bar!!
                            * final: ªªof(foo, "!").bar
                            *
                            * source: foo[bar]!@
                            * prepro: foo[bar]!!
                            * final: ªªof(foo, "!")[bar]
                            */
                            else if (exp.type === 'MemberExpression') {
                                const program = requireFrom(context, 'program');
                                this.willMutate(() => {
                                    importFromRuescript('ªªof', program);
                                });
                                this.willReplace(node, {
                                    type: 'MemberExpression',
                                    start: node.start,
                                    end: node.end,
                                    object: CovertCallExpression('ªªof', [exp.object, CovertString('!')]),
                                    property: exp.property,
                                    computed: exp.computed,
                                    optional: false
                                });
                            }
                        }
                        break;
                    case 'BracketAccessorPostfix':
                        /**
                         * source: obj[count]@
                         * prepro: obj[count]!
                         * final: ªªof(obj)[count]
                         */
                        if (expression.type === 'MemberExpression') {
                            const program = requireFrom(context, 'program');
                            this.willMutate(() => {
                                importFromRuescript('ªªof', program);
                            });
                            this.willReplace(node, {
                                type: 'MemberExpression',
                                start: node.start,
                                end: node.end,
                                object: CovertCallExpression('ªªof', [expression.object]),
                                property: expression.property,
                                computed: true,
                                optional: false
                            });
                        }
                        break;
                    default:
                        break;
                }
            });
        },
        IfStatement(node, context) {
            if (transformIfStatement(node, this, context))
                return;
            this.visit(node.test);
            this.visit(node.consequent);
            if (node.alternate)
                this.visit(node.alternate);
        },
        WhileStatement(node, context) {
            if (transformTestAndBody(node.test, node.body, this, context))
                return;
            this.visit(node.test);
            this.visit(node.body);
        },
        DoWhileStatement(node, context) {
            if (transformTestAndBody(node.test, node.body, this, context))
                return;
            this.visit(node.test);
            this.visit(node.body);
        },
        ConditionalExpression(node, context) {
            if (transformIfStatement(node, this, context))
                return;
            this.visit(node.test);
            this.visit(node.consequent);
            if (node.alternate)
                this.visit(node.alternate);
        },
        LogicalExpression(node, context) {
            if (transformTestAndBody(node.left, node.right, this, context))
                return;
            this.visit(node.left);
            this.visit(node.right);
        },
        JSXElement(node, context) {
            const identifier = node.openingElement.name;
            // source: <::>...</::>
            // preprocess: <Œcomponent>...</Œcomponent>  TODO: preprocess step
            // final: JSXComponent(...)
            if (identifier.type === 'JSXIdentifier' && identifier.name === 'Œcomponent') {
                const program = requireFrom(context, 'program');
                let componentAs = null;
                traverse(node, {}, {
                    JSXAttribute(node) {
                        if (node.name.name === 'as' && node.value?.type === 'JSXExpressionContainer') {
                            componentAs = node.value.expression;
                        }
                    }
                });
                if (componentAs) {
                    this.willMutate(() => {
                        importFromRuescript('JSXComponentAs', program);
                    });
                    this.willReplace(node, {
                        type: 'CallExpression',
                        start: node.start,
                        end: node.end,
                        callee: CovertIdentifier('JSXComponentAs'),
                        arguments: [componentAs, CovertJSXFragment(node.children)],
                        optional: false,
                    });
                }
                else {
                    this.willMutate(() => {
                        importFromRuescript('JSXComponent', program);
                    });
                    this.willReplace(node, {
                        type: 'CallExpression',
                        start: node.start,
                        end: node.end,
                        callee: CovertIdentifier('JSXComponent'),
                        arguments: [CovertJSXFragment(node.children)],
                        optional: false,
                    });
                }
            }
            this.visitChildren(node);
        },
        JSXAttribute(node, context) {
            const { edits } = context;
            /**
             * source: <Comp {attribute} />
             * prepro: <Comp ßattributeß />
             * final: <Comp attribute={attribute} />
             */
            if (node.value === null) {
                edits.at(node.start, edit => {
                    if (edit.type !== 'JSXAttributeShorthand')
                        throw new InternalError(`Unexpected edit type ${edit.type}`);
                    const { identifier } = edit;
                    this.willMutate(() => {
                        node.name.name = identifier; // TODO: what if node.name is replaced before we mutate??
                        node.value = {
                            type: 'JSXExpressionContainer',
                            start: node.start,
                            end: node.end,
                            expression: {
                                type: 'Identifier',
                                start: node.start + 1,
                                end: node.end - 1,
                                name: identifier
                            }
                        };
                    });
                });
            }
            this.visit(node.name);
            if (node.value)
                this.visit(node.value);
        },
    });
}
function CovertJSXFragment(children) {
    return {
        type: 'JSXFragment',
        start: 0,
        end: 0,
        openingFragment: {
            type: 'JSXOpeningFragment',
            start: 0,
            end: 0,
        },
        closingFragment: {
            type: 'JSXClosingFragment',
            start: 0,
            end: 0
        },
        children,
    };
}
function transformIfStatement(node, cursor, context) {
    const { consequent, alternate } = node;
    if (transformAbsorbedTypeGuards(node.test, cursor)) {
        // cursor.visit(node.test)
        transformConditionalBody(consequent, cursor, context);
        cursor.visit(consequent);
        if (alternate) {
            transformConditionalBody(alternate, cursor, context);
            cursor.visit(alternate);
        }
        return true;
    }
    return false;
}
function transformTestAndBody(test, body, cursor, context) {
    if (transformAbsorbedTypeGuards(test, cursor)) {
        // cursor.visit(test)
        transformConditionalBody(body, cursor, context);
        cursor.visit(body);
        return true;
    }
    return false;
}
function transformConditionalBody(node, cursor, context) {
    const { scope } = cursor;
    traverse(node, context, {
        AssignmentExpression(node) {
            if (transformTypeGuardedAccessorVariableWrite(node, scope, this)) {
                return;
            }
            this.visit(node.left);
            this.visit(node.right);
        },
        Identifier(leaf) {
            transformTypeGuardedAccessorVariableRead(leaf, scope, this);
        }
    });
}
function isTSThisParameter(node) {
    return node.name === 'this';
}
function isTSIndexSignatureName(node) {
    return node.parent?.type === 'TSIndexSignature';
}
function hasAwait(node) {
    let has = false;
    traverse(node, {}, {
        AwaitExpression() { has = true; }
    });
    return has;
}
function scopeFunction(cursor, node, context) {
    const body = node.body;
    if (body) {
        const { edits } = context;
        cursor.enterScope();
        node.params.forEach((param, index) => {
            const identifier = findIdentifier(param);
            let objectPattern;
            let arrayPattern;
            // simple parameter with @ operator
            if (identifier) {
                const parameter = identifier.name;
                if (identifier.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
                    context.edits.at(identifier.end, () => {
                        const program = requireFrom(context, 'program');
                        const variable = parameter.slice(0, -1);
                        cursor.scope.addAbsorbedGetter(variable, node);
                        cursor.willMutate(() => {
                            importFromRuescript('toª', program);
                            // bar = toª(bar)
                            if (body.type === 'BlockStatement') {
                                body.body.unshift({
                                    type: 'ExpressionStatement',
                                    start: 0,
                                    end: 0,
                                    expression: {
                                        type: 'AssignmentExpression',
                                        start: 0,
                                        end: 0,
                                        left: CovertIdentifier(variable),
                                        operator: '=',
                                        right: CovertCallExpression('toª', [CovertIdentifier(variable)])
                                    }
                                });
                            }
                        });
                        cursor.willMutate(() => identifier.name = variable);
                        // function foo(bar@ = () => 0) { ... }
                        if (param.type === 'AssignmentPattern') {
                            importFromRuescript('assertª', program);
                            cursor.willMutate(() => {
                                param.right = CovertCallExpression('assertª', [param.right]);
                            });
                        }
                    });
                }
            }
            else if ((objectPattern = findObjectPattern(param)) || (arrayPattern = findArrayPattern(param))) {
                if (objectPattern ? hasAccessorPostfixDestructuring(objectPattern.properties) : hasAccessorPostfixArrayDestructuring(arrayPattern.elements)) {
                    const pattern = objectPattern ?? arrayPattern;
                    const covertName = 'dpª' + index;
                    cursor.willReplace(param, CovertIdentifier(covertName));
                    const covertDestructuring = CovertDestructuring(pattern, CovertIdentifier(covertName));
                    cursor.willMutate(() => {
                        const program = requireFrom(context, 'program');
                        const declaration = importFromRuescript('destructureªª', program);
                        transformNSX({
                            type: 'Program',
                            start: 0,
                            end: 0,
                            hashbang: null,
                            sourceType: 'script',
                            body: [declaration, covertDestructuring]
                        }, edits);
                    });
                    if (body.type === 'BlockStatement') {
                        cursor.willMutate(() => {
                            body.body.unshift(covertDestructuring);
                        });
                    }
                    else {
                        cursor.willReplace(body, CovertFunctionBlockBody(covertDestructuring, body));
                    }
                    declareAbsorbedGettersFromAccessorPostfix(pattern, covertDestructuring, cursor, edits, context);
                }
            }
        });
        let absorbedTypeGuard = false;
        let earlyReturn = false;
        traverse(body, context, {
            IfStatement(node) {
                if (transformAbsorbedTypeGuards(node.test, cursor)) {
                    absorbedTypeGuard = true;
                    traverse(body, context, {
                        ReturnStatement() {
                            earlyReturn = true;
                            if (absorbedTypeGuard && earlyReturn)
                                cursor.skip(node.test);
                        }
                    });
                }
            }
        });
        if (absorbedTypeGuard && earlyReturn) {
            transformConditionalBody(body, cursor, context);
        }
        cursor.visit(body);
        cursor.exitScope();
    }
}
// [
//   {
//     type: 'GetDeclaration',
//     pos: 0,
//     original: 'get count ',
//     transformed: 'let count ',
//     valid: undefined,
//     identifier: 'count'
//   },
//   {
//     type: 'GetDeclaration',
//     pos: 20,
//     original: 'get other ',
//     transformed: 'let other ',
//     valid: undefined,
//     identifier: 'other'
//   }
// ]
// declaration 0 19 {
//   type: 'Identifier',
//   decorators: [],
//   name: 'count',
//   optional: false,
//   typeAnnotation: null,
//   start: 4,
//   end: 9
// }
// edit {
//   type: 'GetDeclaration',
//   pos: 0,
//   original: 'get count ',
//   transformed: 'let count ',
//   valid: undefined,
//   identifier: 'count'
// }
// declaration 20 49 {
//   type: 'Identifier',
//   decorators: [],
//   name: 'other',
//   optional: false,
//   typeAnnotation: null,
//   start: 24,
//   end: 29
// }
// function getEdit(pos: number, edits: Edit[]) {
//    // if (!edit) throw new Error('missing edit')
//    return findEdit(pos, edits)
// }
// #region  get variable transforms
export const ACCESSOR_VARIABLE_POSTFIX = 'ª';
export const ACCESSOR_EXPRESSION_POSTFIX = '!';
function GetterCall(node) {
    return {
        type: 'CallExpression',
        arguments: [],
        start: 0,
        end: 0,
        // @ts-expect-error
        callee: node,
        optional: false
    };
}
function DerivationArrowFunctionExpression(expression) {
    return {
        type: 'ArrowFunctionExpression',
        start: 0,
        end: 0,
        async: expression.type === 'ParenthesizedExpression' && expression.expression.type === 'AwaitExpression',
        body: expression,
        expression: true,
        generator: false,
        id: null,
        params: [],
    };
}
/**
 * @example
 * source: count = expression;
 * final: assertµ(count).value = expression;
 *
 * source: count++;
 * final: assertµ(count).value++;
 */
function queueAccessorVariableWrite(cursor, node, key, left, context) {
    if (cursor.scope.getAbsorbedGetterDeclaration(left.name)) {
        const program = requireFrom(context, 'program');
        cursor.willMutate(() => {
            importFromRuescript('assertµ', program);
            node[key] = {
                type: 'MemberExpression',
                start: 0,
                end: 0,
                computed: false,
                optional: false,
                object: CovertCallExpression('assertµ', [{
                        type: 'Identifier',
                        start: left.start,
                        end: left.end,
                        name: left.name
                    }]),
                property: CovertIdentifier('value')
            };
        });
    }
}
// #endregion
export function isFunctionNode(node) {
    if (!node)
        return;
    return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
}
// #region: import from noriscript
function importFromRuescript(importName, program) {
    const existing = findRuescriptImport(program.body);
    if (existing && hasImport(importName, existing)) {
        return existing;
    }
    const declaration = existing ?? CovertImportDeclaration(RUESCRIPT_IMPORT_SOURCE);
    const specifier = CovertImportSpecifier(importName);
    declaration.specifiers.push(specifier);
    if (!existing)
        program.body.unshift(declaration);
    return declaration;
}
function findRuescriptImport(body) {
    for (const statement of body) {
        if (statement.type === 'ImportDeclaration' && statement.source.value === RUESCRIPT_IMPORT_SOURCE) {
            return statement;
        }
    }
}
function hasImport(name, declaration) {
    const specifiers = declaration.specifiers;
    for (const specifier of specifiers) {
        if (specifier.local.name === name)
            return true;
    }
    return false;
}
const RUESCRIPT_IMPORT_SOURCE = '@luently/noriscript';
function CovertImportDeclaration(source) {
    return {
        type: 'ImportDeclaration',
        start: 0,
        end: 0,
        phase: 'source',
        importKind: 'value',
        attributes: [],
        specifiers: [],
        source: CovertString(source)
    };
}
function CovertIdentifier(name, typeAnnotation) {
    return {
        type: 'Identifier',
        start: 0,
        end: 0,
        name,
        //@ts-expect-error
        typeAnnotation
    };
}
function CovertString(string) {
    return {
        type: 'Literal',
        start: 0,
        end: 0,
        raw: `"${string}"`,
        value: string,
    };
}
function CovertNumber(num) {
    return {
        type: 'Literal',
        start: 0,
        end: 0,
        raw: `${num}`,
        value: num,
    };
}
function CovertDestructuring(pattern, init) {
    return {
        type: 'VariableDeclaration',
        start: 0,
        end: 0,
        kind: 'let',
        declarations: [{
                type: 'VariableDeclarator',
                start: 0,
                end: 0,
                id: pattern,
                init
            }]
    };
}
function CovertImportSpecifier(name) {
    return {
        type: 'ImportSpecifier',
        start: 0,
        end: 0,
        imported: {
            type: 'Identifier',
            start: 0,
            end: 0,
            name
        },
        local: {
            type: 'Identifier',
            start: 0,
            end: 0,
            name
        },
        importKind: 'value',
    };
}
// #endregion
function CovertFunctionBlockBody(insert, body) {
    return {
        type: 'BlockStatement',
        start: 0,
        end: 0,
        body: [
            insert,
            {
                type: 'ReturnStatement',
                start: 0,
                end: 0,
                argument: body
            }
        ]
    };
}
function CovertCallExpression(name, args) {
    return {
        type: 'CallExpression',
        start: 0,
        end: 0,
        arguments: args,
        callee: {
            type: 'Identifier',
            start: 0,
            end: 0,
            name
        },
        optional: false
    };
}
function isAssignee(node) {
    const { parent } = node;
    if (!parent)
        return false;
    return parent.type === 'VariableDeclarator' ||
        parent.type === 'UpdateExpression' ||
        parent.type === 'AssignmentExpression' && parent.left === node;
}
function isPropertyKey(node) {
    const parent = node.parent;
    if (!parent)
        return false;
    return parent.type === 'MemberExpression' && parent.property === node ||
        parent.type === 'ObjectExpression' && parent.properties.find(property => property.type === 'Property' && property.key === node);
}
function declareAbsorbedGettersFromAccessorPostfix(destructuring, declaration, cursor, edits, context) {
    if (destructuring.type === 'ObjectPattern') {
        destructuring.properties.forEach(property => {
            if (property.type === 'RestElement') {
                // TODO: throw compile error?
                console.error('rest element not currently supported for `get` keyword destructuring');
                return;
            }
            const { key, value } = property;
            if (key.type !== 'Identifier') {
                throw new InternalError('uncovered case');
            }
            cursor.skip(key);
            const identifier = findIdentifier(value);
            if (identifier && identifier.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
                cursor.skip(identifier);
                const propertyKey = identifier.name.slice(0, -1);
                cursor.willMutate(() => {
                    key.name = key.name === identifier.name ? propertyKey : key.name;
                    identifier.name = propertyKey;
                });
                cursor.skip(identifier);
                cursor.scope.addAbsorbedGetter(propertyKey, declaration);
                if (value.type === 'AssignmentPattern' && value.left.type === 'Identifier') {
                    const program = requireFrom(context, 'program');
                    cursor.willMutate(() => {
                        importFromRuescript('assertª', program);
                        value.right = CovertCallExpression('assertª', [value.right]);
                    });
                }
            }
            // nested destructuring
            else if (findObjectPattern(value) || findArrayPattern(value)) {
                undoAccessorVariablePostfix(key, cursor, edits);
                declareAbsorbedGettersFromAccessorPostfix(value, declaration, cursor, edits, context);
            }
        });
    }
    else {
        destructuring.elements.forEach(element => {
            if (!element)
                return;
            if (element.type === 'RestElement') {
                // TODO: throw compile error?
                console.error('rest element not currently supported for `get` keyword destructuring');
                return;
            }
            cursor.skip(element);
            const identifier = findIdentifier(element);
            if (identifier && identifier.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
                const propertyKey = identifier.name.slice(0, -1);
                cursor.willMutate(() => {
                    identifier.name = propertyKey;
                });
                cursor.skip(identifier);
                cursor.scope.addAbsorbedGetter(propertyKey, declaration); // TODO: declaration
                if (element.type === 'AssignmentPattern') {
                    const program = requireFrom(context, 'program');
                    cursor.willMutate(() => {
                        importFromRuescript('assertª', program);
                        element.right = CovertCallExpression('assertª', [element.right]);
                    });
                }
            }
            // nested destructuring
            else if (findObjectPattern(element) || findArrayPattern(element)) {
                declareAbsorbedGettersFromGetDestructuring(element, declaration, cursor, edits, context);
            }
        });
    }
}
function findIdentifier(node) {
    return node.type === 'Identifier' ? node : node.type === 'AssignmentPattern' && node.left.type === 'Identifier' ? node.left : undefined;
}
function findObjectPattern(node) {
    return node.type === 'ObjectPattern' ? node : node.type === 'AssignmentPattern' && node.left.type === 'ObjectPattern' ? node.left : undefined;
}
function findArrayPattern(node) {
    return node.type === 'ArrayPattern' ? node : node.type === 'AssignmentPattern' && node.left.type === 'ArrayPattern' ? node.left : undefined;
}
function declareAbsorbedGettersFromGetDestructuring(destructuring, declaration, cursor, edits, context) {
    if (destructuring.type === 'ObjectPattern') {
        destructuring.properties.forEach(property => {
            if (property.type === 'RestElement') {
                // TODO: throw compile error?
                console.error('rest element not currently supported for `get` keyword destructuring');
                return;
            }
            const { key, value } = property;
            if (key.type !== 'Identifier') {
                throw new InternalError('uncovered case');
            }
            cursor.skip(key);
            undoAccessorVariablePostfix(key, cursor, edits);
            const identifier = findIdentifier(value);
            if (identifier) {
                cursor.skip(identifier);
                const propertyKey = undoAccessorVariablePostfix(identifier, cursor, edits);
                cursor.scope.addAbsorbedGetter(propertyKey, declaration);
                if (value.type === 'AssignmentPattern') {
                    const program = requireFrom(context, 'program');
                    cursor.willMutate(() => {
                        importFromRuescript('assertª', program);
                        value.right = CovertCallExpression('assertª', [value.right]);
                    });
                }
            }
            // nested destructuring
            else if (findObjectPattern(value) || findArrayPattern(value)) {
                declareAbsorbedGettersFromGetDestructuring(value, declaration, cursor, edits, context);
            }
        });
    }
    else {
        destructuring.elements.forEach(element => {
            if (!element)
                return;
            if (element.type === 'RestElement') {
                // TODO: throw compile error?
                console.error('rest element not currently supported for `get` keyword destructuring');
                return;
            }
            cursor.skip(element);
            const identifier = findIdentifier(element);
            if (identifier) {
                const propertyKey = undoAccessorVariablePostfix(identifier, cursor, edits);
                cursor.skip(identifier);
                undoAccessorVariablePostfix(identifier, cursor, edits);
                cursor.scope.addAbsorbedGetter(propertyKey, declaration);
                if (element.type === 'AssignmentPattern') {
                    const program = requireFrom(context, 'program');
                    cursor.willMutate(() => {
                        importFromRuescript('assertª', program);
                        element.right = CovertCallExpression('assertª', [element.right]);
                    });
                }
            }
            // nested destructuring
            else if (findObjectPattern(element) || findArrayPattern(element)) {
                declareAbsorbedGettersFromGetDestructuring(element, declaration, cursor, edits, context);
            }
        });
    }
}
function undoAccessorVariablePostfix(node, cursor, edits) {
    let variable = node.name;
    if (node.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
        edits.at(node.end, edit => {
            variable = node.name.slice(0, -1) + '@';
            /**
             * unwrite ª --> @
             */
            cursor.willMutate(() => {
                node.name = variable;
            });
        });
    }
    return variable;
}
function CovertObjectExpression(properties = []) {
    return {
        type: 'ObjectExpression',
        start: 0,
        end: 0,
        properties
    };
}
function CovertArrayExpression(elements = []) {
    return {
        type: 'ArrayExpression',
        start: 0,
        end: 0,
        elements
    };
}
function CovertObjectProperty(key, value, computed = false) {
    return {
        type: 'Property',
        start: 0,
        end: 0,
        computed,
        key: CovertIdentifier(key),
        kind: 'init',
        method: false,
        shorthand: false,
        value
    };
}
function isAccessorPostfixDestructuring(declarator) {
    if (declarator.id.type === 'Identifier' || declarator.id.type === 'AssignmentPattern')
        return false;
    if (declarator.id.type === 'ObjectPattern') {
        return hasAccessorPostfixDestructuring(declarator.id.properties);
    }
    if (declarator.id.type === 'ArrayPattern') {
        return hasAccessorPostfixArrayDestructuring(declarator.id.elements);
    }
}
function hasAccessorPostfixDestructuring(properties) {
    for (const property of properties) {
        if (property.type !== 'Property')
            continue;
        const { value } = property;
        const identifier = findIdentifier(value);
        if (identifier && identifier.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
            return true;
        }
        const objectPattern = findObjectPattern(value);
        if (objectPattern) {
            return hasAccessorPostfixDestructuring(objectPattern.properties);
        }
        const arrayPattern = findArrayPattern(value);
        if (arrayPattern) {
            return hasAccessorPostfixArrayDestructuring(arrayPattern.elements);
        }
    }
    return false;
}
function hasAccessorPostfixArrayDestructuring(elements) {
    for (const element of elements) {
        if (!element)
            continue;
        if (element.type === 'RestElement')
            continue;
        const identifier = findIdentifier(element);
        if (identifier && identifier.name.endsWith(ACCESSOR_VARIABLE_POSTFIX)) {
            return true;
        }
        const objectPattern = findObjectPattern(element);
        if (objectPattern) {
            return hasAccessorPostfixDestructuring(objectPattern.properties);
        }
        const arrayPattern = findArrayPattern(element);
        if (arrayPattern) {
            return hasAccessorPostfixArrayDestructuring(arrayPattern.elements);
        }
    }
    return false;
}
// { a, b = 'hi' } --> { a: 1, b: 1 }
// { a, b: { c = 'hi' } = { c: 'hi' } }
function ObjectDestructuringMapFromGetKeyword(destructuring, transformName = name => name, deriveValue = () => CovertNumber(1)) {
    const objectExpression = CovertObjectExpression();
    const { properties } = destructuring;
    properties.forEach((property, index) => {
        if (property.type === 'RestElement') {
            throw new InternalError('uncovered case');
            return; // TODO: throw compiler error?
        }
        const { key, value } = property;
        if (key.type !== 'Identifier') {
            throw new InternalError('uncovered case');
            return; // TODO: throw compiler error?
        }
        const identifier = findIdentifier(value);
        let objectPattern;
        let arrayPattern;
        if (identifier) {
            objectExpression.properties[index] = CovertObjectProperty(transformName(key.name), deriveValue(identifier.name), property.computed);
        }
        else if (objectPattern = findObjectPattern(value)) {
            objectExpression.properties[index] = CovertObjectProperty(transformName(key.name), ObjectDestructuringMapFromGetKeyword(objectPattern, transformName, deriveValue), property.computed);
        }
        else if (arrayPattern = findArrayPattern(value)) {
            objectExpression.properties[index] = CovertObjectProperty(transformName(key.name), ArrayDestructuringMapFromGetKeyword(arrayPattern, transformName, deriveValue), property.computed);
        }
    });
    return objectExpression;
}
function ArrayDestructuringMapFromGetKeyword(destructuring, transformName = name => name, deriveValue = () => CovertNumber(1)) {
    const arrayExpression = CovertArrayExpression();
    const { elements } = destructuring;
    elements.forEach((element, index) => {
        if (!element)
            return;
        if (element.type === 'RestElement') {
            throw new InternalError('uncovered case');
            return; // TODO: throw compiler error?
        }
        const identifier = findIdentifier(element);
        let objectPattern;
        let arrayPattern;
        if (identifier) {
            arrayExpression.elements[index] = deriveValue(identifier.name);
        }
        else if (objectPattern = findObjectPattern(element)) {
            arrayExpression.elements[index] = ObjectDestructuringMapFromGetKeyword(objectPattern, transformName, deriveValue);
        }
        else if (arrayPattern = findArrayPattern(element)) {
            arrayExpression.elements[index] = ArrayDestructuringMapFromGetKeyword(arrayPattern, transformName, deriveValue);
        }
    });
    return arrayExpression;
}
// #region: Type Guards
// - truthy conditions: `!!obj` `obj` `obj !== undefined` `obj != undefined` , `null`
// - falsey conditions: `!obj` `obj === undefined` `obj == undefined` , `null`
const TYPE_GUARD_PREFIX = 'ø_';
/**
 * @example
 * let ø_obj: ReturnType<typeof obj>;
 */
function CovertTypeGuardVariableDeclaration(variable) {
    return {
        type: 'VariableDeclaration',
        start: 0,
        end: 0,
        kind: 'let',
        declarations: [{
                type: 'VariableDeclarator',
                start: 0,
                end: 0,
                id: CovertIdentifier(TYPE_GUARD_PREFIX + variable, {
                    type: 'TSTypeAnnotation',
                    start: 0,
                    end: 0,
                    typeAnnotation: {
                        type: 'TSTypeReference',
                        start: 0,
                        end: 0,
                        typeName: CovertIdentifier('ReturnType'),
                        typeArguments: {
                            type: 'TSTypeParameterInstantiation',
                            start: 0,
                            end: 0,
                            params: [{
                                    type: 'TSTypeQuery',
                                    start: 0,
                                    end: 0,
                                    exprName: CovertIdentifier(variable),
                                    typeArguments: null,
                                }]
                        }
                    }
                }),
                init: null,
            }]
    };
}
function CovertSequenceExpression(expressions) {
    return {
        type: 'SequenceExpression',
        start: 0,
        end: 0,
        expressions
    };
}
function CovertAssignmentExpression(left, operator, right) {
    return {
        type: 'AssignmentExpression',
        start: 0,
        end: 0,
        left,
        operator: '=',
        right
    };
}
/**
 * - inserts type guard helper variable after declaration: e.g. let ø_obj: ReturnType<typeof obj>;
 * - replaces accessor variable with: e.g. (ø_obj = obj(), ø_obj)
 */
function transformAbsorbedTypeGuards(test, cursor) {
    if (test.type === 'Identifier') {
        const { scope } = cursor;
        const variable = test.name;
        const declaration = scope.getAbsorbedGetterDeclaration(variable);
        if (declaration) {
            const typeGuardHelperVariable = TYPE_GUARD_PREFIX + variable;
            if (!scope.isTypeGuarded(variable)) {
                scope.markTypeGuarded(variable);
                if (declaration.type === 'VariableDeclaration') {
                    // TODO: prevent multiple type guard variable declarations
                    cursor.willInsertAfter(declaration, CovertTypeGuardVariableDeclaration(variable));
                }
                else {
                    const { body } = declaration;
                    if (!body)
                        return false;
                    if (body.type === 'BlockStatement') {
                        cursor.willMutate(() => {
                            // TODO: prevent multiple type guard variable declarations
                            body.body.unshift(CovertTypeGuardVariableDeclaration(variable));
                        });
                    }
                    else {
                        // TODO: prevent multiple type guard variable declarations
                        cursor.willReplace(body, CovertFunctionBlockBody(CovertTypeGuardVariableDeclaration(variable), body));
                    }
                }
            }
            if (isAssignee(test)) {
                return true;
            }
            // (ø_obj = obj(), ø_obj)
            else {
                cursor.willReplace(test, CovertSequenceExpression([
                    CovertAssignmentExpression(CovertIdentifier(typeGuardHelperVariable), '=', {
                        type: 'CallExpression',
                        start: 0,
                        end: 0,
                        callee: test,
                        arguments: [],
                        optional: false
                    }),
                    CovertIdentifier(typeGuardHelperVariable)
                ]));
            }
            return true;
        }
        return false;
    }
    if (test.type === 'UnaryExpression') {
        return transformAbsorbedTypeGuards(test.argument, cursor);
    }
    if (test.type === 'BinaryExpression' && test.left.type !== 'PrivateIdentifier') {
        return transformAbsorbedTypeGuards(test.left, cursor);
    }
    if (test.type === 'LogicalExpression') {
        const left = transformAbsorbedTypeGuards(test.left, cursor);
        const right = transformAbsorbedTypeGuards(test.right, cursor);
        return left || right;
    }
    if (test.type === 'AssignmentExpression') {
        const { left } = test;
        // FIX:
        const assignee = transformAbsorbedTypeGuards(left, cursor);
        if (assignee) {
            if (left.type !== 'Identifier')
                throw new InternalError('uncovered case assignment expression');
            const variable = left.name;
            const typeGuardHelperVariable = TYPE_GUARD_PREFIX + variable;
            cursor.willReplace(test, CovertSequenceExpression([
                CovertAssignmentExpression(CovertIdentifier(typeGuardHelperVariable), '=', CovertIdentifier(variable)),
                CovertIdentifier(typeGuardHelperVariable)
            ]));
        }
        const right = transformAbsorbedTypeGuards(test.right, cursor);
        return assignee || right;
    }
    if (test.type === 'SequenceExpression') {
        return transformAbsorbedTypeGuards(test.expressions.at(-1), cursor);
    }
    return false;
}
/**
 * @example
 * source: obj
 * transform: (obj as typeof ø_obj)
 * final: (obj() as typeof ø_obj)
 */
function transformTypeGuardedAccessorVariableRead(identifier, scope, cursor) {
    if (!identifier.name || isAssignee(identifier) || isPropertyKey(identifier) || isTSIndexSignatureName(identifier) || isTSThisParameter(identifier))
        return false;
    if (scope.isTypeGuarded(identifier.name)) {
        cursor.willReplace(identifier, {
            type: 'TSAsExpression',
            start: 0,
            end: 0,
            expression: identifier,
            typeAnnotation: {
                type: 'TSTypeQuery',
                exprName: CovertIdentifier(TYPE_GUARD_PREFIX + identifier.name),
                start: 0,
                end: 0,
                typeArguments: null,
            },
        });
        return true;
    }
    return false;
}
/**
 * @example
 *  ø_obj = assertµ(obj).value = value
 */
function transformTypeGuardedAccessorVariableWrite(assignment, scope, cursor) {
    const { left } = assignment;
    if (left.type === 'Identifier' && scope.isTypeGuarded(left.name)) {
        cursor.willReplace(assignment, {
            type: 'AssignmentExpression',
            start: 0,
            end: 0,
            left: CovertIdentifier(TYPE_GUARD_PREFIX + left.name),
            operator: assignment.operator,
            right: assignment
        });
        return true;
    }
    return false;
}
class InternalError extends Error {
}
