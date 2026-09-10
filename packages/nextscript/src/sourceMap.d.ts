import type { EncodedSourceMap } from '@jridgewell/gen-mapping';
import type { CodeMapping } from '@volar/language-core';
export declare function codeMappingsToSourceMap(sourceFile: string, generatedFile: string, source: string, generated: string, mappings: CodeMapping[]): EncodedSourceMap;
