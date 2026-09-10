const RegexAllowedAfterWords = new Set([
    'case',
    'delete',
    'do',
    'else',
    'in',
    'instanceof',
    'new',
    'of',
    'return',
    'throw',
    'typeof',
    'void',
    'yield',
]);
const RegexAllowedAfterPunct = new Set([
    '(',
    '[',
    '{',
    ',',
    ';',
    ':',
    '?',
    '=',
    '!',
    '~',
    '+',
    '-',
    '*',
    '%',
    '&',
    '|',
    '^',
    '<',
    '>',
]);
function isIdentifierStart(char) {
    return /[A-Za-z_$]/.test(char);
}
function isIdentifierPart(char) {
    return /[A-Za-z0-9_$]/.test(char);
}
function startsRegexLiteral(prevToken) {
    if (!prevToken)
        return true;
    if (prevToken.startsWith('word:')) {
        const word = prevToken.slice(5);
        return RegexAllowedAfterWords.has(word);
    }
    return RegexAllowedAfterPunct.has(prevToken);
}
/**
 * Finds the opening `{` index that matches a closing `}` at `closingIndex`.
 * Braces inside strings, comments, and regex literals are ignored.
 */
export function searchOpeningBrace(code, closingIndex) {
    if (code[closingIndex] !== '}')
        return undefined;
    const stack = [];
    let prevToken;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplateString = false;
    let inLineComment = false;
    let inBlockComment = false;
    let inRegex = false;
    let inRegexCharClass = false;
    let escapeNext = false;
    for (let i = 0; i <= closingIndex; i++) {
        const char = code[i];
        const next = code[i + 1];
        if (inLineComment) {
            if (char === '\n' || char === '\r') {
                inLineComment = false;
            }
            continue;
        }
        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false;
                i += 1;
            }
            continue;
        }
        if (inSingleQuote || inDoubleQuote) {
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            if ((inSingleQuote && char === "'") || (inDoubleQuote && char === '"')) {
                inSingleQuote = false;
                inDoubleQuote = false;
                prevToken = 'literal';
            }
            continue;
        }
        if (inTemplateString) {
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            if (char === '`') {
                inTemplateString = false;
                prevToken = 'literal';
                continue;
            }
            if (char === '$' && next === '{') {
                stack.push(i + 1);
                inTemplateString = false;
                prevToken = '{';
                i += 1;
            }
            continue;
        }
        if (inRegex) {
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            if (inRegexCharClass) {
                if (char === ']') {
                    inRegexCharClass = false;
                }
                continue;
            }
            if (char === '[') {
                inRegexCharClass = true;
                continue;
            }
            if (char === '/') {
                inRegex = false;
                while (isIdentifierPart(code[i + 1] ?? '')) {
                    i += 1;
                }
                prevToken = 'literal';
            }
            continue;
        }
        if (char === '/' && next === '/') {
            inLineComment = true;
            i += 1;
            continue;
        }
        if (char === '/' && next === '*') {
            inBlockComment = true;
            i += 1;
            continue;
        }
        if (char === "'") {
            inSingleQuote = true;
            escapeNext = false;
            continue;
        }
        if (char === '"') {
            inDoubleQuote = true;
            escapeNext = false;
            continue;
        }
        if (char === '`') {
            inTemplateString = true;
            escapeNext = false;
            continue;
        }
        if (char === '/') {
            if (startsRegexLiteral(prevToken)) {
                inRegex = true;
                inRegexCharClass = false;
                escapeNext = false;
                continue;
            }
            prevToken = '/';
            continue;
        }
        if (isIdentifierStart(char)) {
            let end = i + 1;
            while (isIdentifierPart(code[end] ?? '')) {
                end += 1;
            }
            prevToken = `word:${code.slice(i, end)}`;
            i = end - 1;
            continue;
        }
        if (char === '{') {
            stack.push(i);
            prevToken = char;
            continue;
        }
        if (char === '}') {
            const match = stack.pop();
            if (i === closingIndex)
                return match;
            prevToken = char;
            if (code[i + 1] === '`') {
                inTemplateString = true;
            }
            continue;
        }
        if (!/\s/.test(char)) {
            prevToken = char;
        }
    }
    return undefined;
}
