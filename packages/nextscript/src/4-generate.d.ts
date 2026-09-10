import type { Node as ASTNode } from 'oxc-parser';
import { CodeInformation, CodeMapping } from "@volar/language-core";
export declare function printTSX(program: ASTNode): {
    code: string;
    map: CodeMapping[];
};
export type BaseNode = {
    type: string;
};
type NodeOf<K extends string, X> = X extends {
    type: infer T;
} ? K extends T ? X : never : never;
export type Visit<T> = (node: T, cursor: CodePrinter) => void;
export type Visitors<T extends BaseNode = BaseNode> = {
    [K in T['type']]?: Visit<NodeOf<K, T>>;
};
declare class CodePrinter {
    private visitors;
    code: string;
    map: CodeMapping[];
    private static readonly DEFAULT_MAPPING_CAPABILITIES;
    private depth;
    enterScope(): void;
    exitScope(): void;
    indentScope(): void;
    indent(): void;
    constructor(visitors: Visitors<ASTNode>);
    write(text: string, map?: {
        span: {
            start: number;
            end: number;
        };
        capabilities?: CodeInformation;
    }): void;
    mapSpan(start: number, map: {
        span: {
            start: number;
            end: number;
        };
        capabilities?: CodeInformation;
    }): void;
    private activeNodes;
    private visitNode;
    visit(node: ASTNode | null | undefined, parent?: ASTNode): void;
    visitEach(nodes: (ASTNode | null | undefined)[], parent?: ASTNode): void;
}
export {};
