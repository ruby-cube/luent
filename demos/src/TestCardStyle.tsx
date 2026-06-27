import { component, mount, template } from "@rue/luent";
import "./ui/card.css"

export function TestCardStyle() {
    return component(
        <div class='card'>hello world</div>
    )
}   

if (__STYLE__)
    mount(TestCardStyle, '#root')