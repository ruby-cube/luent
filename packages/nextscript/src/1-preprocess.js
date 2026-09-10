import { ACCESSOR_EXPRESSION_POSTFIX, ACCESSOR_VARIABLE_POSTFIX } from "./3-transform.ts";
import { searchOpeningBrace } from "./searchOpeningBrace.ts";
const AccessorEditType = {
    '?': 'OptionalAccessorPostfix',
    '!': 'NonNullAccessorPostfix',
    ']': 'BracketAccessorPostfix',
    ')': 'AccessorExpressionPostfix',
};
function encodeGap(group) {
    return group
        .replace(/[ \t]/g, '_')
        .replace(/\/\*/g, 'ƒº')
        .replace(/\*\//g, 'ºƒ');
}
// TODO: current regexes are temporary naive implementations that need to be replaced with more robust searches
function applyOffsets(edits) {
    let offset = 0;
    for (const edit of edits) {
        edit.index = edit.index + offset;
        offset += edit.offset;
    }
}
/**
 * Applies edits to the code and returns transformed code
 *
 * @param code source
 * @param edits Assumes edits
 * - are in order from lowest pos to highest pos
 * - edits do not overlap // TODO: I don't know if I can guarantee this
 * @returns
 */
function applyEdits(code, edits) {
    if (edits.length === 0) {
        return code;
    }
    let result = code;
    for (const edit of edits) {
        result = result.slice(0, edit.index) + edit.transformed + result.slice(edit.index + edit.original.length);
    }
    return result;
}
export class Edits {
    edits;
    /**
     * The last visited index
     */
    lastIndex = 0;
    constructor(edits) {
        this.edits = edits;
    }
    find(anchor) {
        const { edits, lastIndex } = this;
        const limit = edits.length;
        for (let i = lastIndex; i < limit; i++) {
            const edit = edits[i];
            if (anchor === edit.anchor) {
                this.lastIndex = i;
                return edit;
            }
        }
    }
    at(anchor, task) {
        const edit = this.find(anchor);
        if (edit)
            task(edit);
        return edit;
    }
}
// TODO: make sure regex is correct
class NSXPreprocessor {
    source;
    _edits = [];
    edits;
    code = '';
    inserts = 0;
    offset = 0;
    constructor(source) {
        this.source = source;
    }
    transform() {
        this.rewriteGetVariableDeclarations();
        this.rewriteGetDestructuring();
        this.rewriteGetPropertyColonNotation();
        this.rewriteAccessorVariablePostfix();
        this.rewriteExpressionPostfix();
        this.rewriteBlockDerivationExpression();
        this.rewriteJSXAttributeShorthand();
        const edits = this._edits.toSorted((a, b) => a.index - b.index);
        applyOffsets(edits);
        this.code = applyEdits(this.source, edits);
        this.edits = new Edits(edits);
        return this;
    }
    /**
     * - Replaces `get` variable declaration pattern with intermediary valid js.
     * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string)
     *
     * Example:
     * `get count =` -->
     * `let count =`
     */
    rewriteGetVariableDeclarations() {
        const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([\p{ID_Start}$][\p{ID_Continue}$\u200C\u200D]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?==(?![=>]))/gu;
        const matches = this.source.matchAll(pattern);
        for (const match of matches) {
            const [original, before, identifier, after] = match;
            const index = match.index;
            const transformed = 'let' + before + identifier + after;
            this._edits.push({
                type: 'GetDeclaration',
                index,
                anchor: index,
                // anchorType: 'start',
                original,
                transformed,
                identifier,
                offset: 0
            });
        }
    }
    /**
     * - Replaces `get` variable declaration pattern with intermediary valid js.
     * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string)
     *
     * Example:
     * `get { count } =` -->
     * `let { count } =`
     */
    rewriteGetDestructuring() {
        const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([\{\[])/gu;
        const matches = this.source.matchAll(pattern);
        for (const match of matches) {
            const [original, gap, bracket] = match;
            const index = match.index;
            const transformed = 'let' + gap + bracket;
            this._edits.push({
                type: 'GetDestructuring',
                index,
                anchor: index,
                // anchorType: 'start',
                original,
                transformed,
                offset: 0
            });
        }
    }
    /**
     * - Replaces `get` property colon notation pattern with intermediary valid js.
     * - Stores edits in edits array for reversion if needed (e.g. if pattern is in string or not in object literal)
     *
     * Example:
     * `get count:` -->
     * `gª, count:`
     */
    rewriteGetPropertyColonNotation() {
        const pattern = /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([\p{ID_Start}$][\p{ID_Continue}$\u200C\u200D]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?=:)/gu;
        const matches = this.source.matchAll(pattern);
        for (const match of matches) {
            const [original, before, identifier, after] = match;
            const index = match.index;
            const transformed = 'gª,' + before + identifier + after;
            this._edits.push({
                type: 'GetPropertyColonNotation',
                index,
                anchor: index,
                // anchorType: 'start',
                original,
                transformed,
                identifier,
                offset: 0,
            });
        }
    }
    rewriteAccessorVariablePostfix() {
        const pattern = /([\p{ID_Continue}$\u200C\u200D])@([\s/().;,<:=}])/gu;
        const matches = this.source.matchAll(pattern);
        for (const match of matches) {
            const [original, identifier] = match;
            const index = match.index;
            this._edits.push({
                type: 'AccessorVariablePostfix',
                index,
                anchor: index + 2,
                // anchorType: 'end',
                original: original.slice(0, -1),
                transformed: identifier + ACCESSOR_VARIABLE_POSTFIX,
                identifier,
                offset: 0,
            });
        }
    }
    // expression postfix
    // nonnullable postfix
    // optional postfix
    // bracket postfix
    rewriteExpressionPostfix() {
        const pattern = /([)?!\]])@[\s/()}]/g;
        const matches = this.source.matchAll(pattern);
        for (const match of matches) {
            const [original, before] = match;
            const index = match.index;
            this._edits.push({
                type: AccessorEditType[before],
                index,
                anchor: index + 2, // NOTE: range for non-null expression ends after !
                // anchorType: 'end',
                original: original.slice(0, -1),
                transformed: (before === '?' ? '!' : before) + ACCESSOR_EXPRESSION_POSTFIX,
                offset: 0,
                offsetReversed: false
            });
        }
    }
    /**
     * @example
     * source:     { const c = 0 ; return a + b }@
     * prepro: (ª=>{ const c = 0 ; return a + b })
     */
    rewriteBlockDerivationExpression() {
        const pattern = /\}@[\s/;(),}\]]?/g;
        const matches = this.source.matchAll(pattern);
        for (const match of matches) {
            const index = match.index;
            const openingBracket = searchOpeningBrace(this.source, index);
            if (openingBracket === undefined)
                continue;
            this._edits.push({
                type: 'BlockDerivationExpressionOpen',
                index: openingBracket,
                anchor: openingBracket,
                // anchorType: 'start',
                original: '{',
                transformed: `(ª=>{`,
                offset: 4,
                offsetReversed: false
            }, {
                type: 'BlockDerivationExpressionClose',
                index,
                anchor: index + 1,
                // anchorType: 'end',
                original: '}@',
                transformed: `})`,
                offset: 0,
                offsetReversed: false
            });
        }
    }
    rewriteJSXAttributeShorthand() {
        const pattern = /[\s]\{([\p{ID_Start}$][\p{ID_Continue}$\u200C\u200D]*)\}/gu;
        const matches = this.source.matchAll(pattern);
        for (const match of matches) {
            const [original, identifier] = match;
            const index = match.index + 1;
            this._edits.push({
                type: 'JSXAttributeShorthand',
                index,
                anchor: index,
                // anchorType: 'start',
                original: original.slice(1),
                transformed: `ß${identifier}ß`,
                identifier,
                offset: 0,
                offsetReversed: false
            });
        }
    }
}
// export function unwriteGetDeclarations(string: string, edits: Edit[] = []) {
//    let result = string
//    for (let i = edits.length - 1; i >= 0; i--) {
//       const edit = edits[i]
//       result = result.slice(0, edit.pos) + edit.original + result.slice(edit.pos + edit.original.length)
//    }
//    return result
// }
/**
 * Preprocess nsx source into valid tsx
 */
export function preprocessNSX(source) {
    // (1) TODO: pre-parser // tree of string, regex, code leaf nodes, and object literals, template literals, JSXText
    // (2) walk tree and rewrite code to valid jsx
    return new NSXPreprocessor(source).transform(); // walks rough ast for preprocessing
}
