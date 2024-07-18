//@ts-nocheck
import { AnyObject } from "@rue/types";
import { forEachIn } from "./forEachIn";


template(App, 'app-tmp', html`
<h1>{heading}</h1>
<div>
    <ul>
        <li class="$for-items">{item}</li>
    </ul>
</div>
<app-description class="$if-active"></app-description>
<side-bar></side-bar>
<div></div>
`)

template(SideBar, 'side-bar', html`
<div>{userName}</div>
`)




function App() {

    const itemsRef = useNodeRef('.$for-items')
    const sideBarRef = useNodeRef('side-bar')
    const menuItemRef = useNodeRef('menu-item')

    bind(counterRef, {
        text: $count
    })

    const itemsRef = defineNodesFor(list$,
        (item, $index) => ({
            text: item,
            class: [
                (o) => {
                    if ($dragging())
                        o.add('dragging');

                    if ($highlighted() && $isActive())
                        o.add('highlight');
                },
                (o) => { // one-to-one binding, fine-grained
                    if ($dragging())
                        o.add('dragging')
                },
                (o) => {
                    if ($highlighted() && $isActive())
                        o.add('highlight')
                }
            ]
        }))

    bindFor(menuItemRef, menu.$, (item, $index) => ({
        props: {
            $index
        }
    }))


}


function bind(id: string, config: AnyObject) {

}


function html(string: TemplateStringsArray) {
    return string[0];
}

function template(tag: string, templateString: string) {

}