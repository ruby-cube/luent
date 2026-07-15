import { marked } from 'marked'
import { ion } from '@rue/quarky'
import './style.css'
// import { Part } from './MarkdownApp_a'

// adapted from Vue.js markdown app example

export function TestMarkdownApp() {

  const $markdown = ion('# Hello Bubba')
  const $html = ion(() => marked($markdown()) as string)

  return <>
    <div class='editor'>
      <textarea class='input' mu:value={$markdown}/>
      <div class='output'>{{ html: $html }}</div>
      {/* <Part></Part> */}
    </div>
    <o-link href='/src/MarkdownApp.css' rel='stylesheet' />
  </>
}
