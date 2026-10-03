import * as serverProtocol from "@volar/language-server/protocol";
import { activateAutoInsertion, createLabsInfo, getTsdk } from "@volar/vscode";
import * as vscode from "vscode";
import * as lsp from "vscode-languageclient/node";
import * as fs from "node:fs";
import * as path from "node:path";

let client: lsp.BaseLanguageClient;
let outputChannel: vscode.OutputChannel | undefined;

function hasTypeScriptRuntime(tsdkPath: string): boolean {
  return (
    fs.existsSync(path.join(tsdkPath, "typescript.js")) ||
    fs.existsSync(path.join(tsdkPath, "tsserverlibrary.js"))
  );
}

async function resolveTypeScriptSdkPath(
  context: vscode.ExtensionContext,
): Promise<string | undefined> {
  const volarTsdk = await getTsdk(context);
  if (volarTsdk?.tsdk && hasTypeScriptRuntime(volarTsdk.tsdk)) {
    return volarTsdk.tsdk;
  }

  const configuredTsdk = vscode.workspace
    .getConfiguration("typescript")
    .get<string>("tsdk");

  if (configuredTsdk) {
    if (path.isAbsolute(configuredTsdk) && hasTypeScriptRuntime(configuredTsdk)) {
      return configuredTsdk;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      const resolved = path.join(workspaceRoot, configuredTsdk);
      if (hasTypeScriptRuntime(resolved)) {
        return resolved;
      }
    }
  }

  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const workspaceLib = path.join(folder.uri.fsPath, "node_modules", "typescript", "lib");
    if (hasTypeScriptRuntime(workspaceLib)) {
      return workspaceLib;
    }
  }

  const builtInTsExtension = vscode.extensions.getExtension(
    "vscode.typescript-language-features",
  );

  if (builtInTsExtension) {
    const bundled = vscode.Uri.joinPath(
      builtInTsExtension.extensionUri,
      "node_modules",
      "typescript",
      "lib",
    ).fsPath;

    if (hasTypeScriptRuntime(bundled)) {
      return bundled;
    }
  }

  try {
    const resolvedTs = require.resolve("typescript/lib/typescript.js");
    const resolvedLib = path.dirname(resolvedTs);
    if (hasTypeScriptRuntime(resolvedLib)) {
      return resolvedLib;
    }
  } catch {
    // Ignore; we'll surface a clear startup error below.
  }
}

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("NoriScript Extension");
  context.subscriptions.push(outputChannel);

  const serverModule = vscode.Uri.joinPath(
    context.extensionUri,
    "out",
    "noriscript-language-server.mjs",
  );
  const vendorNodeModules = vscode.Uri.joinPath(
    context.extensionUri,
    "vendor_node_modules",
  ).fsPath;
  const env = {
    ...process.env,
    NODE_PATH: process.env.NODE_PATH
      ? `${vendorNodeModules}:${process.env.NODE_PATH}`
      : vendorNodeModules,
  };

  const serverOptions: lsp.ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: <string[]>[], env },
    },
    debug: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=" + 6009], env },
    },
  };

  const tsdk = await resolveTypeScriptSdkPath(context);
  if (!tsdk) {
    outputChannel.appendLine("[startup] Failed to resolve TypeScript SDK path.");
    void vscode.window.showErrorMessage(
      "NoriScript could not locate a TypeScript SDK. Set 'typescript.tsdk' to a valid lib folder.",
    );
    return;
  }

  outputChannel.appendLine(`[startup] serverModule: ${serverModule.fsPath}`);
  outputChannel.appendLine(`[startup] vendorNodeModules: ${vendorNodeModules}`);
  outputChannel.appendLine(`[startup] tsdk: ${tsdk}`);

  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: [{ language: "noriscript" }],
    initializationOptions: {
      typescript: {
        tsdk,
      },
    },
  };

  client = new lsp.LanguageClient(
    "noriscript-language-server",
    "NoriScript Language Server",
    serverOptions,
    clientOptions,
  );
  await client.start();

  activateAutoInsertion("noriscript", client);

  // Add support for Volar Labs
  // https://volarjs.dev/core-concepts/volar-labs/
  const labsInfo = createLabsInfo(serverProtocol);
  labsInfo.addLanguageClient(client);

  return labsInfo.extensionExports;
}

export function deactivate(): Thenable<any> | undefined {
  outputChannel?.dispose();
  return client?.stop();
}