import { marked } from 'marked'
import { ion } from '@luently/quarky'
import './style.css'

// adapted from Vue.js markdown app example

export function TestMarkdownApp() {

  const $markdown = ion('# Hello Bubba')
  const $html = ion(() => marked($markdown()) as string)

  return <>
    <div class='editor'>
      <textarea class='input' slot-type='mu:text'>{$markdown}</textarea>
      <div class='output'>{{ html: $html }}</div>
    </div>
    <o-link href='/src/MarkdownApp.css' rel='stylesheet' />
  </>
}
