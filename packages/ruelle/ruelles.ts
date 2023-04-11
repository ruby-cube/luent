import { isRef, onMounted, ref, Ref, watch } from "vue";
import { MiscObj } from "@rue/types";

type Model = MiscObj

//Use cases: 
// (deprecated) model --> ui (maybe be mapped to many ui's)  for when ui actions are dependent on model's tree traversal
// node ---> model for when getSelection()
// model --> node   to place caret

//Requirements:
// a model cannot belong to more than instance of a component, i.e. reused in the content model tree (e.g. to create a mirror effect);
// a model can only map to one nodeRef and vice versa


const modelToNodeRefMap: WeakMap<Model, Ref> = new WeakMap();
const nodeToModelMap: WeakMap<Node, Model> = new WeakMap();

export function nodeRef<M extends Model>(model?: M): Ref<Node | undefined> {
    if (model == null) return ref();
    // const model = modelGetter();
    // if (model == null) throw new Error("[Ruelle] Model getter does not return a model");

    // mapNodeRef
    const nodeRef = ref();
    modelToNodeRefMap.set(model, nodeRef); //QUESTION: How do I make sure multiple mappings aren't overwriting each other?
    onMounted(() => nodeToModelMap.set(nodeRef.value, model)); //QUESTION: How do I make sure multiple mappings aren't overwriting each other?

    // update node if node changes
    watch(() => nodeRef.value, (newNode) => {
        nodeToModelMap.set(newNode, model);
    })

    // update model if model changes (this is only needed if a key is not used on component)
    // watch(modelGetter, (model) => {
    //     if (__DEV__) console.warn("[RESEARCH] If this is running, then watching the model is actually needed!")
    //     modelToNodeRefMap.set(model, nodeRef)
    // })

    return nodeRef;
}







//@ts-expect-error: Guaranteed Return
export function toModel<N extends Node>(DOMNode: N): Model {
    const model = nodeToModelMap.get(DOMNode);
    if (model) return model;
    if (__DEV__) throw new Error("[Ruelle] No model found. DOMNode ref must be mapped to the model by calling `ruelleMap` in component setup");
}

// //@ts-expect-error: Guaranteed Return
// export function toUI<M extends Model>(model: M, name?: string): UIParcel {
//     const uiMap = modelToUIMap.get(model);
//     if (uiMap) {
//         if (name) {
//             const ui = uiMap.get(name);
//             if (ui) return ui;
//             if (__DEV__) throw new Error("[Ruelle] No ui parcel found. Model must be mapped to ui parcel by calling `ruelleMap` in component setup");
//         }
//         else {
//             if (uiMap.size === 1) return uiMap.entries().next() as unknown as UIParcel;
//             if (__DEV__ && uiMap.size === 0) throw new Error("[Ruelle] `uiMap` is empty. Model must be mapped to ui parcel by calling `ruelleMap` in component setup")
//             if (__DEV__ && uiMap.size > 1) throw new Error("[Ruelle] `uiMap` has multiple entries. Specify which ui parcel to return with `name` parameter")
//         }
//     }
//     if (__DEV__) throw new Error("[Ruelle] No ui map found. Model must be mapped to ui parcel by calling `ruelleMap` in component setup");
// }

//@ts-expect-error: Guaranteed Return
export function toDOMNode<M extends Model>(model: M): Node {
    const nodeRef = modelToNodeRefMap.get(model);
    if (nodeRef) return nodeRef.value;
    if (__DEV__) throw new Error("[Ruelle] No model found. DOMNode ref must be mapped to the model by calling `ruelleMap` in component setup");
}

//EXAMPLES: 
// const ui = { kermit: "frog" };
// const model = { robin: "frog" };

// ruelleMap(() => vProps.model, listRef, "list");
// ruelleMap(() => vProps.model, ui, "CaretSlot");

// toUI(item, "CaretSlot");
