import { Component, ComponentSetup, InternalComponent, popComponent, pushComponent } from "./component";
import { NodeEntity, setUpComponent } from "./mE";
import { makeComponent } from "./mO";
import { _NodePod } from "./NodePod";

export function createApp(App: ComponentSetup) {
    return {
        App,
        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof HTMLElement)) throw new Error('No root element to mount app to. Check selector string')
            const component = makeComponent(this.App)
            const nodePod = new _NodePod();
            pushComponent(component)
            setUpComponent(component, root, component, nodePod)
            popComponent()
        }
    }
}



