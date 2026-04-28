import { Component, ComponentTag, FromTag, makeComponent } from "@rue/luent"


type NestedAttributeKit = {
   selector: string,
   setup: (Element: ComponentTag) => any
}

function nest(selector: string, setup: (Element: ComponentTag) => any) {
   return {
      selector,
      setup
   }
}

function nestAttributes(fragment: DocumentFragment, kits: NestedAttributeKit[]) {
   for (const kit of kits) {
      const { selector, setup } = kit
      const node = fragment.querySelector(selector);
      setup(input => ({ as: undefined, nodes: [node] }))
   }
}


// example

function App() {
   <Board
      at:nest={nest('.close', Button =>
         <Button on:click={() => console.log('clicked')} />
      )}
   ></Board>
}

function Board(setup: FromTag<{ 'at:nest': (select: HTMLElement['querySelector']) => void }>) {
   return Component(
      <div>
         <button class='open'></button>
      </div>
   )
}