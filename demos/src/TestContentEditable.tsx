import { ion, track } from "luent"

export function TestContentEditable() {
  const $text = ion('Write something...')
  track($text, () => {
    console.log('$text')
  })
  return <>
    <div contenteditable='true'>{$text}</div>
  </>
}