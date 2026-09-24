import { ion, observe } from "luent"

export function TestContentEditable() {
  const $text = ion('Write something...')
  observe($text, () => {
    console.log('$text')
  })
  return <>
    <div contenteditable='true'>{$text}</div>
  </>
}