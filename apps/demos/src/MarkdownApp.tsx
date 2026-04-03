import { marked } from 'marked'
import { ion } from '@rue/quarky'
import { template, FromTag, NodeRef, atMounted, atUnmount } from '@rue/luent'
import './style.css'

// Demo from Vue.js

export function TestMarkdownApp() {

   const $markdown = ion('# Hello World')
   const $html = ion(() => marked($markdown()) as string)

   return template(
      <>
         <div class='editor'>
            <textarea class='input' mu:value={$markdown}></textarea>
            <div class='output' innerHTML={$html}></div>
         </div>
         <o--link href='/src/MarkdownApp.css' rel='stylesheet'/>
      </>
   )
}
