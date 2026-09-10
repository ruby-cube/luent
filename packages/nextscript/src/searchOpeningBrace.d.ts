/**
 * Finds the opening `{` index that matches a closing `}` at `closingIndex`.
 * Braces inside strings, comments, and regex literals are ignored.
 */
export declare function searchOpeningBrace(code: string, closingIndex: number): number | undefined;
