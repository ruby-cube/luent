//@ts-nocheck
import { AnyObject } from "@rue/types";
import { html } from "../../../packages/literate/src/Literate.js";
import { Component, fromTag, v } from "@rue/lumo";

export function AboutPageB() {
   return [
      {
         title: 'About'
      },
      html`
            <h3>About</h3>
            <div>About Me: Lorem Ipsum</div>
            <Something client cat='hi'></Something>
        `
   ]
}

export function AboutPage() {
   return [
      {
         title: 'About'
      },
      html`
         <h3>About</h3>
         <div>About Me: Lorem Ipsum</div>
         ${<Something cat='hi'>
            <div>hilo</div>
         </Something>}
         <div>okay</div>
      `
   ]
}

function Something(input = fromTag({
   cat: v<string>
})) {
   return Component(
      <div>
         'hello'
      </div>
   )
}