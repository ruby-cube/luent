import { marked } from 'marked'
import { Ion, Ionic, ion } from '@rue/quarky'
import { component, template, FromTag, NodeRef, atAttach, beforeDetach, beforeUnmount, atMount } from '@rue/luent'
import '../../style.css'


export function MarkdownApp(
   // input: FromTag<{
   //    'mu:markdown'?: Ion<string>
   // }>
) {

   // const { $markdown = ion('# Hello World') } = input
   const $markdown = ion('# Hello World')

   const $html = ion(() => marked($markdown()) as string)


   // const update = (e: any) => {
   //    //@ts-expect-error
   //    $markdown.value = e.target.value
   // }

   const $textArea = NodeRef('textarea')

   const caretRange = ionic({
      selectionStart: undefined as undefined | number,
      selectionEnd: undefined as undefined | number,
   })
   // <create-view> <remount-view>
   beforeUnmount(() => {
      const textArea = $textArea()!
      const isActive = document.activeElement !== textArea
      caretRange.selectionStart = isActive ? textArea.selectionStart : undefined
      caretRange.selectionEnd = isActive ? textArea.selectionEnd : undefined
   })

   atMount(() => {
      const textArea = $textArea()!
      const { selectionEnd, selectionStart } = caretRange
      if (selectionStart === undefined) return;
      textArea.focus();
      textArea.selectionStart = selectionStart
      textArea.selectionEnd = selectionEnd!
   })

   const $count = ion(0, {
      increment() {
         $count.value++
      }
   })

   const $doubleCount = ion(() => $count() * 2)

   // NOTE: There's actually no reason to pause and resume this watcher since it is watching local state. 
   // Pausing and resuming is only helpful if state is shared across views
   // and state can be mutated outside of the hidden view

   return component(
      <>
         <div>local state: {$count}</div>
         <div>local state: {$doubleCount}</div>
         <button on:click={e => $count.increment()}>+</button>
         <div class='editor'>
            <textarea class='input' ref={$textArea} mu:value={$markdown}></textarea>
            <div class='output'>{{ html: $html }}</div>
         </div>
         <o-link href='/src/demo/markdown-app/markdown-app.css' rel='stylesheet' />
      </>
   )
}
