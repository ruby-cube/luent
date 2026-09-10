type BaseEdit = {
    index: number;
    anchor: number;
    original: string;
    transformed: string;
    offset: number;
    offsetReversed?: boolean;
};
export type Edit = VariableEdit | ExpressionEdit;
export type VariableEdit = {
    type: 'GetDeclaration' | 'GetPropertyColonNotation' | 'AccessorVariablePostfix' | 'JSXAttributeShorthand';
    identifier: string;
} & BaseEdit;
export type ExpressionEdit = {
    type: 'AccessorExpressionPostfix' | 'OptionalAccessorPostfix' | 'NonNullAccessorPostfix' | 'BracketAccessorPostfix' | 'BlockDerivationExpressionOpen' | 'BlockDerivationExpressionClose' | 'GetDestructuring';
} & BaseEdit;
export declare class Edits {
    private edits;
    /**
     * The last visited index
     */
    lastIndex: number;
    constructor(edits: Edit[]);
    find(anchor: number): Edit | undefined;
    at(anchor: number, task: (edit: Edit) => void): Edit;
}
declare class NSXPreprocessor {
    readonly source: string;
    _edits: Edit[];
    edits: Edits;
    code: string;
    private inserts;
    private offset;
    constructor(source: string);
    transform(): this;
    /**
     * - Replaces `get` variable declaration pattern with intermediary valid js.
     * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string)
     *
     * Example:
     * `get count =` -->
     * `let count =`
     */
    rewriteGetVariableDeclarations(): void;
    /**
     * - Replaces `get` variable declaration pattern with intermediary valid js.
     * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string)
     *
     * Example:
     * `get { count } =` -->
     * `let { count } =`
     */
    rewriteGetDestructuring(): void;
    /**
     * - Replaces `get` property colon notation pattern with intermediary valid js.
     * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string or not in object literal)
     *
     * Example:
     * `get count:` -->
     * `gª, count:`
     */
    rewriteGetPropertyColonNotation(): void;
    rewriteAccessorVariablePostfix(): void;
    rewriteExpressionPostfix(): void;
    /**
     * @example
     * source:     { const c = 0 ; return a + b }@
     * prepro: (ª=>{ const c = 0 ; return a + b })
     */
    rewriteBlockDerivationExpression(): void;
    rewriteJSXAttributeShorthand(): void;
}
/**
 * Preprocess nsx source into valid tsx
 */
export declare function preprocessNSX(source: string): NSXPreprocessor;
export {};
