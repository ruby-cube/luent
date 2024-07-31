import { PublicComponent, ComponentSetup, InternalComponent, popComponent, pushComponent } from "./component/component";
import { NodeEntity, RenderFunction } from "./node/makeNode";
import { mO } from "./component/mO";
import { _NodePod } from "./node/NodePod";
import { setUpComponent } from "./component/setUpComponent";

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



