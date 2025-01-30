import { marked } from 'marked'
//@ts-expect-error
import { debounce } from 'lodash-es'
import { ion, ionize, watch } from '@rue/quarky'
import { component, fromTag, Ion, NodeRef, v } from '@rue/lumo'
import { $thisView } from '../../../../../packages/lumo/src/flask/ViewFlask'


export function MarkdownApp(
   input = fromTag({
      'nu:markdown': Ion<string>('??')('#Hello World')
   })
) {

   const { $markdown } = input

   const $output = ion(() => (console.log('getting output'), marked($markdown())))


   const update = debounce((e: any) => {
      //@ts-expect-error
      $markdown.state = e.target.value
   }, 100)

   const $textArea = NodeRef('textarea')

   const caretRange = ionize({
      selectionStart: undefined as undefined | number,
      selectionEnd: undefined as undefined | number,
   })

   $thisView().onUnmount(final => {
      if (final) return;
      const textArea = $textArea()!
      const isActive = document.activeElement !== textArea
      caretRange.selectionStart = isActive ? textArea.selectionStart : undefined
      caretRange.selectionEnd = isActive ? textArea.selectionEnd : undefined
   })

   $thisView().onMount(initial => {
      if (initial) return;
      const textArea = $textArea()!
      const { selectionEnd, selectionStart } = caretRange
      if (selectionStart === undefined) return;
      textArea.focus();
      textArea.selectionStart = selectionStart
      textArea.selectionEnd = selectionEnd!
   })

   const $count = ion(0, {
      increment() {
         console.log('incrementing')
         $count.state++
      }
   })

   const $doubleCount = ion(()=>$count()*2)

   // watch($count, e => {
   //    console.log(e.newState)
   // })
   // watch($markdown, e => {
   //    console.log(e.newState)
   // })

   // watch($output, e => {
   //    console.log(e.newState)
   // })
   //NOTE: There's actually no reason to pause and resume this watcher since it is watching local state. 
   // Pausing and resuming is only helpful if state is shared across views
   // and state can be mutated outside of the hidden view

   function setCaret() {
      const textArea = $textArea()!
      textArea.focus()
      textArea.selectionStart = 3;
      textArea.selectionEnd = 3;
   }

   function getCaret() {
      const textArea = $textArea()!
      console.log(textArea.selectionStart, textArea.selectionEnd)
   }

   return component(
      <>
         <div>local state: {$count}</div>
         <div>local state: {$doubleCount}</div>
         <button on:click={$count.increment}>increment</button>
         {/* <button on:click={setCaret}>caret</button> */}
         {/* <button on:click={getCaret}>get caret</button> */}
         <div class='editor'>
            <textarea class='input' on:input={update} ref={$textArea}>{$markdown}</textarea>
            {/* <div class='output'>{$output}</div> */}
            <div class='output'>{{ innerHTML: $output }}</div>
            {/* <textarea>{$markdown}</textarea> */}
         </div>
         <$--link href='/src/demos/markdown-app/markdown-app.css' rel='stylesheet' />
      </>
   )
}
