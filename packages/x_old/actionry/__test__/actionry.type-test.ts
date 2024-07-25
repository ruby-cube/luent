
//USAGE:

import { defineMessage, send } from "../../archer/Archer"
import { $type } from "../../types"
import { doAction } from "../actionry"





const RENDER_TEXT = defineMessage({
    message: "render-text",
    targetID: $type as string,
    data: $type as {
        blot: { insertText(text: string): void }
    }
})


function insertText(blot: any, text: string) { }

export function reMouseDown(event: Event) {

    const blot = {} as { insertText(text: string): void }

    doAction("insertText", () => {  //use string and arrow function for unshared compound functions
        blot.insertText("hi");
        send(RENDER_TEXT, { to: "aaa", data: { blot } })
    }, {
        event,
        blot
    })
}


export function reMouseLeave(event: Event) {
    const blot = {} as { insertText(text: string): void }

    doAction(insertText, ($do) => $do(blot, "hi"), { // use function and $do if shared function or single call action
        event,
        blot,
        cumulate: true
    })
}
