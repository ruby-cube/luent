import { CodeMapping } from "@volar/language-core";

export function generateMappings(source: string, transpiled: { ast: { type: string }, code: string }, map: [number, number, number, number][][]): CodeMapping[] {
   return [] as any as CodeMapping[]
}

      // this.mappings = [{
      //    sourceOffsets: [0],
      //    generatedOffsets: [0],
      //    lengths: [length],
      //    data: {
      //       completion: true,
      //       format: true,
      //       navigation: true,
      //       semantic: true,
      //       structure: true,
      //       verification: true,
      //    },
      // }];