import * as ts from "typescript"
import { lintMuMutationProgram } from "./mu-mutation-linter"

declare const process: {
   argv: string[]
   exit: (code: number) => never
}

function run() {
   const inputPath = process.argv[2] ?? ".jungle/mu-linting/mu-linting.tsx"
   const filePath = ts.sys.resolvePath(inputPath)
   const cwd = ts.sys.getCurrentDirectory()

   const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, "tsconfig.json")
   if (!configPath) {
      console.error("Could not find tsconfig.json")
      process.exit(1)
   }

   const configSource = ts.readConfigFile(configPath, ts.sys.readFile)
   if (configSource.error) {
      console.error(formatDiagnostic(configSource.error))
      process.exit(1)
   }

   const parsed = ts.parseJsonConfigFileContent(configSource.config, ts.sys, cwd)
   const program = ts.createProgram({
      rootNames: parsed.fileNames,
      options: parsed.options,
   })

   const issues = lintMuMutationProgram(program)
      .filter((issue) => ts.sys.resolvePath(issue.filePath) === filePath)
      .sort((a, b) => (a.filePath === b.filePath ? a.line - b.line || a.column - b.column : a.filePath.localeCompare(b.filePath)))

   if (issues.length === 0) {
      console.log("No mu mutation lint issues found.")
      return
   }

   for (const issue of issues) {
      console.log(`${issue.filePath}:${issue.line}:${issue.column} [${issue.code}] ${issue.message}`)
   }

   process.exit(1)
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
   const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
   if (!diagnostic.file || diagnostic.start == null) {
      return message
   }

   const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
   return `${diagnostic.file.fileName}:${line + 1}:${character + 1} ${message}`
}

run()
