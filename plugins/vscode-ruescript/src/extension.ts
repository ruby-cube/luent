import * as serverProtocol from "@volar/language-server/protocol";
import { activateAutoInsertion, createLabsInfo } from "@volar/vscode";
import * as vscode from "vscode";
import * as lsp from "vscode-languageclient/node";

let client: lsp.BaseLanguageClient;

export async function activate(context: vscode.ExtensionContext) {
  const serverModule = vscode.Uri.joinPath(
    context.extensionUri,
    "node_modules",
    "@rue/ruescript-language-server",
    "dist",
    "ruescript-language-server.js",
  );

  const serverOptions: lsp.ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: <string[]>[] },
    },
    debug: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=" + 6009] },
    },
  };

  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: [{ language: "ruescript" }],
    initializationOptions: {},
  };

  client = new lsp.LanguageClient(
    "ruescript-language-server",
    "RueScript Language Server",
    serverOptions,
    clientOptions,
  );
  await client.start();

  activateAutoInsertion("ruescript", client);

  // Add support for Volar Labs
  // https://volarjs.dev/core-concepts/volar-labs/
  const labsInfo = createLabsInfo(serverProtocol);
  labsInfo.addLanguageClient(client);

  return labsInfo.extensionExports;
}

export function deactivate(): Thenable<any> | undefined {
  return client?.stop();
}