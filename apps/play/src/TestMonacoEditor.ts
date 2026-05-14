import * as monaco from "monaco-editor"
import "./TestMonacoEditor.css"


export function initMonacoEditor() {
   const value = /* set from `myEditor.getModel()`: */ `function hello() {
      alert('Hello world!');
   }`;

 self.MonacoEnvironment = {
	getWorkerUrl: function (_moduleId: any, label: string) {
		if (label === 'json') {
			return './json.worker.bundle.js';
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return './css.worker.bundle.js';
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return './html.worker.bundle.js';
		}
		if (label === 'typescript' || label === 'javascript') {
			return './ts.worker.bundle.js';
		}
		return './editor.worker.bundle.js';
	}
};


   // Hover on each property to see its docs!
   const myEditor = monaco.editor.create(document.getElementById("monaco-editor-container")!, {
      value,
      language: "typescript",
      automaticLayout: true
   });

   

}
