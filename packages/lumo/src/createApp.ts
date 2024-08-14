import { PublicComponent, ComponentSetup, InternalComponent, popComponent, pushComponent } from "./component/InternalComponent";
import { NodeEntity, RenderFunction } from "./node/makeNode";
import { mO, runComponentSetup } from "./component/mO";
import { _NodePod } from "./node/NodePod";
import { setUpComponent } from "./component/setUpComponent";
import { collectEffects, Flask } from "@rue/flask";

let appRoot: Element;

export function getAppRoot(){
    return appRoot;
}

export function createApp(App: RenderFunction) {
    return {
        App,
        flask: undefined as Flask | undefined,
        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
            appRoot = root;
            const parentComponent = new InternalComponent(null, false);
            const component = mO(this.App, undefined)
            const nodePod = new _NodePod();
            pushComponent(parentComponent)
            collectEffects((flask) => {
                this.flask = flask
                setUpComponent(parentComponent, root, component, nodePod)
            })
            popComponent()
            return component;
        },
        unmount() {
            this.flask?.dispose()
        }

    }
}



