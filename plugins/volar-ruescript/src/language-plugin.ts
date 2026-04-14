import { transpileRueScript } from '@rue/ruescript';
import { CodeMapping, LanguagePlugin, VirtualCode } from '@volar/language-core';
import type * as ts from 'typescript';
import { URI } from 'vscode-uri';

// FIX: Volar starter

type ScriptId = URI | string;

function scriptPath(id: ScriptId | undefined) {
   if (!id) return '';
   if (typeof id === 'string') return id;
   return id.path;
}

function isRueScriptFile(id: ScriptId | undefined, languageId: string) {
   const path = scriptPath(id);
   return languageId === 'ruescript' || path.endsWith('.rxs');
}

function isRueScriptVirtualCode(code: VirtualCode) {
   return code.id === 'root' && code.languageId === 'typescriptreact';
}

export const ruescriptLanguagePlugin: LanguagePlugin<ScriptId> = {
   getLanguageId(scriptId) {
      if (scriptPath(scriptId).endsWith('.rxs')) {
         return 'ruescript';
      }
   },
   createVirtualCode(scriptId, languageId, snapshot) {
      if (isRueScriptFile(scriptId, languageId)) {
         return new RueScriptVirtualCode(scriptPath(scriptId), snapshot);
      }
   },
   typescript: {
      extraFileExtensions: [{ extension: 'rxs', isMixedContent: true, scriptKind: 4 satisfies ts.ScriptKind.TSX }],
      getServiceScript(root) {
         if (isRueScriptVirtualCode(root)) {
            return {
               code: root,
               extension: '.tsx',
               scriptKind: 4 satisfies ts.ScriptKind.TSX,
            };
         }
      },
   },
};


function createSnapshot(text: string): ts.IScriptSnapshot {
   return {
      getText(start, end) {
         return text.slice(start, end);
      },
      getLength() {
         return text.length;
      },
      getChangeRange() {
         return undefined;
      },
   };
}


export class RueScriptVirtualCode implements VirtualCode {
   id = 'root';
   languageId = 'typescriptreact';
   mappings: CodeMapping[] = []
   snapshot: ts.IScriptSnapshot

   constructor(filePath: string, sourceSnapshot: ts.IScriptSnapshot) {
      const length = sourceSnapshot.getLength()
      const source = sourceSnapshot.getText(0, length)
      const result = transpileRueScript(filePath || 'virtual.rxs', source)
      this.snapshot = createSnapshot(result.transpiled.code)
      this.mappings = result.map
   }
}