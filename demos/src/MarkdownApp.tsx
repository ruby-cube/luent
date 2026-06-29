import { marked } from 'marked'
import { ion } from '@rue/quarky'
import { component } from '@rue/luent'
import './style.css'

// Demo from Vue.js

export function TestMarkdownApp() {

  const $markdown = ion('# Hello World')
  const $html = ion(() => marked($markdown()) as string)

  return (

    <>
      <div class='editor'>
        <textarea class='input' mu:value={$markdown}></textarea>
        <div class='output'>{{ html: $html }}</div>
      </div>
      <o-link href='/src/MarkdownApp.css' rel='stylesheet' />
    </>
  )
}
