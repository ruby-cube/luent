import { PublicComponent, ComponentSetup, InternalComponent, popComponent, pushComponent } from "./component";
import { NodeEntity, RenderFunction } from "./makeNode";
import { setUpComponent } from "./mE";
import { mO } from "./mO";
import { _NodePod } from "./NodePod";

export function createApp(App: RenderFunction) {
    return {
        App,
        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
            const component = mO(this.App, undefined)
            const nodePod = new _NodePod();
            pushComponent(component)
            setUpComponent(component, root, component, nodePod)
            popComponent()
        }
    }
}



