import { css, Style } from "luent";

export function TestStyleComments() {
  return <>
    <div>Hello world</div>
    {Style(css`
      div {
        color: red;
        // opacity: .5;
        background-color: beige;
      }  
    `)}
  </>
}