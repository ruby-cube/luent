import { print } from 'esrap'
import type { Node as TSNode } from 'esrap/languages/ts'
import type { Node as ASTNode } from 'oxc-parser'
import tsx from 'esrap/languages/tsx'

export function printTSX(ast: ASTNode) {
   return print(ast as unknown as TSNode, tsx())
}