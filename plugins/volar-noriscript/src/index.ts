import { createConnection, createServer, createTypeScriptProject, Diagnostic, loadTsdkByPath } from '@volar/language-server/node';
import { create as createCssService } from 'volar-service-css';
import { create as createTypeScriptServices } from 'volar-service-typescript';
import {createNextScriptService} from './noriscript-service'
import { noriscriptLanguagePlugin } from './language-plugin';

// FIX: Volar starter

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize(params => {
   const tsdk = loadTsdkByPath(params.initializationOptions.typescript.tsdk, params.locale);
   return server.initialize(
      params,
      createTypeScriptProject(tsdk.typescript, tsdk.diagnosticMessages, () => ({
         languagePlugins: [noriscriptLanguagePlugin],
      })),
      [
         createCssService(),
         ...createTypeScriptServices(tsdk.typescript),
         createNextScriptService(),
      ],
   )
});

connection.onInitialized(server.initialized);

connection.onShutdown(server.shutdown);
