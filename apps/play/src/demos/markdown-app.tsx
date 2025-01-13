import { marked } from 'marked'
import { debounce } from 'lodash-es'
import { ion } from '@rue/quarky'
import { component } from '@rue/lumo'


export function MarkdownApp() {

   const $input = ion('# Hello World')
   const $output = ion(() => marked($input()))

   const update = debounce(e => {
      $input.state = e.target.value
   }, 100)

   return component(
      <div class='editor'>
         <textarea class='input' on:input={update}>{$input}</textarea>
         <div class='output'>{$output}</div>
         <div class='output'>{{ innerHTML: $output }}</div>
      </div>
   )
}
