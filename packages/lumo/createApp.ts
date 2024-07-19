import { Component, ComponentSetup, InternalComponent, setCurrentComponent } from "./component";
import { NodeEntity, setUpComponent } from "./mE";
import { makeComponent } from "./makeComponent";
import { _NodePod } from "./NodePod";

export function createApp(App: ComponentSetup) {
    return {
        App,
        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof HTMLElement)) throw new Error('No root element to mount app to. Check selector string')
            const component = makeComponent(this.App)
            const nodePod = new _NodePod();
            setUpComponent(new InternalComponent('root', false), root, component, nodePod)
        }
    }
}



