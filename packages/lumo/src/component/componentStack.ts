import { EffectFlask } from "@rue/flask";

export type Component = { flask: EffectFlask | undefined, parent: Component | null }

// Manages component "stack"
let currentComponent: Component | null = null;
let prevComponent: Component | null = null;

export function getCurrentComponent<T extends Component>(): T | null {
    return currentComponent as T | null;
}

export function pushComponent(component: Component | null) {
    prevComponent = currentComponent;
    currentComponent = component;
    const flask = component?.flask
    if (flask) flask.reactivate()
}

export function popComponent() {
    const popped = currentComponent;
    currentComponent = prevComponent;
    prevComponent = prevComponent?.parent || null
    const flask = popped?.flask;
    if (flask) flask.deactivate();
    return popped;
}