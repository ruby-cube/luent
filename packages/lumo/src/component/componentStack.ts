
export type TreeNode = { parent: TreeNode | null }

// Manages component "stack"
let currentComponent: TreeNode | null = null;
let parent: TreeNode | null = null;

export function getCurrentComponent<T extends TreeNode>(): T | null {
    return currentComponent as T | null;
}

export function pushComponent(component: TreeNode | null) {
    parent = currentComponent;
    currentComponent = component;
}

export function popComponent() {
    const popped = currentComponent;
    currentComponent = parent;
    parent = parent?.parent || null
    return popped;
}