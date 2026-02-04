import { marked } from 'marked'
import { Ion, Ionic, watch } from '@rue/quarky'
import { component, FromTag, NodeRef, atMounted, atUnmount } from '@rue/lumo'
import '../style.css'

// Demo from Vue.js

export function TestMarkdownApp() {

   const $markdown = Ion('# Hello World')
   const $html = Ion(() => marked($markdown()) as string)

   return component(
      <>
         <div class='editor'>
            <textarea class='input' mu:value={$markdown}></textarea>
            <div class='output' innerHTML={$html}></div>
         </div>
         <o--link href='/src/demo/markdown-app.css' rel='stylesheet' />
      </>
   )
}
