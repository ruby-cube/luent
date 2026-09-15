import { asJSX } from "luent"
import { FromTag } from "packages/luent/dist"

export function TestDynamicTag(setup: FromTag<{ tag: 'div' | 'button' }>) {
  const { tag: Tag } = setup;

  return <>
    <Tag style='color: red'>hello</Tag>
  </>
}