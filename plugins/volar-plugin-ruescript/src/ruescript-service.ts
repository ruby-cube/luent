import type { LanguageServicePlugin, LanguageServicePluginInstance } from "@volar/language-server"

export function createRueScriptService(): LanguageServicePlugin {
   return {
      name: 'ruescript-service', // used to identify the service in the logs and in Volar Labs
      create(context): LanguageServicePluginInstance {
         return {
            provideHover(document, position, token) {
               // Implement hover support here
            },
            // More methods...
         };
      },
      capabilities: {

      }
   }
}

// Starter example
//  {
//             capabilities: {
//                diagnosticProvider: {
//                   interFileDependencies: false,
//                   workspaceDiagnostics: false,
//                },
//             },
//             create(context) {
//                return {
//                   provideDiagnostics(document) {
//                      const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
//                      if (!decoded) {
//                         // Not a embedded document
//                         return;
//                      }
//                      const virtualCode = context.language.scripts.get(decoded[0])?.generated?.embeddedCodes.get(decoded[1]);
//                      if (!(virtualCode instanceof Html1VirtualCode)) {
//                         return;
//                      }
//                      const styleNodes = virtualCode.htmlDocument.roots.filter(root => root.tag === 'style');
//                      if (styleNodes.length <= 1) {
//                         return;
//                      }
//                      const errors: Diagnostic[] = [];
//                      for (let i = 1; i < styleNodes.length; i++) {
//                         errors.push({
//                            severity: 2,
//                            range: {
//                               start: document.positionAt(styleNodes[i].start),
//                               end: document.positionAt(styleNodes[i].end),
//                            },
//                            source: 'html1',
//                            message: 'Only one style tag is allowed.',
//                         });
//                      }
//                      return errors;
//                   },
//                };
//             },
//          },