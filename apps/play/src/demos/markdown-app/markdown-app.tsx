import { marked } from 'marked'
//@ts-expect-error
import { debounce } from 'lodash-es'
import { ion } from '@rue/quarky'
import { component, fromTag, Ion, v } from '@rue/lumo'


export function MarkdownApp(
   input = fromTag({
      markdown: Ion<string>('??')('#Hello World')
   })
) {

   const { $markdown } = input

   const $input = ion('# Hello World')
   const $output = ion(() => marked($input()))

   const update = debounce((e: any) => {
      $input.state = e.target.value
   }, 100)

   return component(
      <>
         <div class='editor'>
            <textarea class='input' on:input={update}>{$input}</textarea>
            <div class='output'>{$output}</div>
            <div class='output'>{{ innerHTML: $output }}</div>
         </div>
         <$--link href='/src/demos/markdown-app/markdown-app.css' rel='stylesheet' />
      </>
   )
}
