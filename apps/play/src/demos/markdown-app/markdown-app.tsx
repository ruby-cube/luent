import { marked } from 'marked'
import { Ion, ion, ionize, watch } from '@rue/quarky'
import { component, FromTag, NodeRef, atMounted, atUnmount } from '@rue/lumo'


export function MarkdownApp(
   input : FromTag<{
      'mu:markdown'?: Ion<string>
   }>
) {

   const { $markdown = ion('# Hello World') } = input
   // const $markdown = ion('Hello World')

   const $output = ion(() => (marked($markdown())))


   // const update = (e: any) => {
   //    //@ts-expect-error
   //    $markdown.state = e.target.value
   // }

   const $textArea = NodeRef('textarea')

   const caretRange = ionize({
      selectionStart: undefined as undefined | number,
      selectionEnd: undefined as undefined | number,
   })

   atUnmount((final) => {
      if (final) return;
      const textArea = $textArea()!
      const isActive = document.activeElement !== textArea
      caretRange.selectionStart = isActive ? textArea.selectionStart : undefined
      caretRange.selectionEnd = isActive ? textArea.selectionEnd : undefined
   })

   atMounted((initial) => {
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
         $count.state++
      }
   })



   const $doubleCount = ion(() => $count() * 2)

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




   return component(
      <>
         <div>local state: {$count}</div>
         <div>local state: {$doubleCount}</div>
         <button on:click={e => $count.increment()}>increment</button>
         <div class='editor'>
            <textarea class='input' ref={$textArea}>{{ mu: $markdown }}</textarea>
            {/* <div class='output'>{$output}</div> */}
            <div class='output'>{{ innerHTML: $output }}</div>
            {/* <textarea>{$markdown}</textarea> */}
         </div>
         <o--link href='/src/demos/markdown-app/markdown-app.css' rel='stylesheet' />
      </>
   )
}
