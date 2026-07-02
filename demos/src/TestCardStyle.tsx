import { component, mountIsland, template } from "@rue/luent";
import "./ui/card.css"

export function TestCardStyle() {
    return (

        <div class='card'>hello world</div>
    )
}   

if (__STYLE__)
    mountIsland(TestCardStyle, '#root')