import { Node as ASTNode } from 'oxc-parser';
import { Edits } from "./1-preprocess.ts";
export declare function transformNSX(ast: ASTNode, edits: Edits): any;
export declare const ACCESSOR_VARIABLE_POSTFIX = "\u00AA";
export declare const ACCESSOR_EXPRESSION_POSTFIX = "!";
export declare function isFunctionNode(node: ASTNode | undefined): boolean;
