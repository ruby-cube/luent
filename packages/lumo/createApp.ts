import { AnyObject } from "@rue/types";
import { Component, ComponentSetup, InternalComponent, setCurrentComponent } from "./component";
import { LifecycleHook } from "./lifecycle";
import { NodeEntity, setUpComponent } from "./mx";
import { mxO } from "./mxO";
import { _NodePod } from "./NodePod";

export function createApp(App: ComponentSetup) {
    return {
        App,
        mount(id: string) {
            const root = document.querySelector(id);
            if (!(root instanceof HTMLElement)) throw new Error('No root element to mount app to. Check selector string')
            const component = mxO(this.App)
            const nodePod = new _NodePod();
            setUpComponent(new InternalComponent('root'), root, component, nodePod)
        }
    }
}



