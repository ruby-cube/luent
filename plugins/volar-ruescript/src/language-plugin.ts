import { transpileRueScript } from '@rue/ruescript';
import { CodeMapping, forEachEmbeddedCode, LanguagePlugin, VirtualCode } from '@volar/language-core';
import type { TypeScriptExtraServiceScript } from '@volar/typescript';
import type * as ts from 'typescript';
import { URI } from 'vscode-uri';
import { generateMappings } from './mappings';

// FIX: Volar starter

export const ruescriptLanguagePlugin: LanguagePlugin<URI> = {
   getLanguageId(uri) {
      if (uri.path.endsWith('.rxs')) {
         return 'ruescript';
      }
   },
   createVirtualCode(_uri, languageId, snapshot) {
      if (languageId === 'ruescript') {
         return new RueScriptVirtualCode(snapshot);
      }
   },
   typescript: {
      extraFileExtensions: [{ extension: 'rxs', isMixedContent: true, scriptKind: 4 satisfies ts.ScriptKind.TSX }],
      getServiceScript() {
         return undefined;
      },
      getExtraServiceScripts(fileName, root) {
         // TODO:
         const scripts: TypeScriptExtraServiceScript[] = [];
         for (const code of forEachEmbeddedCode(root)) {
            if (code.languageId === 'javascript') {
               scripts.push({
                  fileName: fileName + '.' + code.id + '.js',
                  code,
                  extension: '.js',
                  scriptKind: 1 satisfies ts.ScriptKind.JS,
               });
            }
            else if (code.languageId === 'typescript') {
               scripts.push({
                  fileName: fileName + '.' + code.id + '.ts',
                  code,
                  extension: '.ts',
                  scriptKind: 3 satisfies ts.ScriptKind.TS,
               });
            }
         }
         return scripts;
      },
   },
};


export class RueScriptVirtualCode implements VirtualCode {
   id = 'root';
   languageId = 'ruescript';
   mappings: CodeMapping[] = []

   constructor(public snapshot: ts.IScriptSnapshot) {
      const length = snapshot.getLength()
      const source = snapshot.getText(0, length)
      const result = transpileRueScript('virtual.rxs'/* FIX:? */, source)
      this.mappings = result.map
   }
}