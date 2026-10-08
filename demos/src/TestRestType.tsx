import { FromTag } from "luent";

export function TestRestType(setup: FromTag<'button'>) {

  return <>
    <button auto-bind={setup}></button>
  </>
}