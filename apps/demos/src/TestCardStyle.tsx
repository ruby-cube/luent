import { createRoot, template } from "@rue/luent";
import "./ui/card.css"

export function TestCardStyle() {
    return template(
        <div class='card'>hello world</div>
    )
}   

if (__STYLE__)
    createRoot(() =>
        <TestCardStyle></TestCardStyle>
    ).mount('#root')