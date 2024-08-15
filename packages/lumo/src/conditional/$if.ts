import { DerivedSignal, getWithoutTracking, hasSignal, ReactiveModel, ReactiveSignal, toRaw } from "@rue/muonic";
import { getCurrentComponent, InternalComponent } from "../component/InternalComponent";
import { _NodePod } from "../node/NodePod";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { watchForRender, initializeRender } from "../reactivity/watchForRender";
import { onActivated, onDeactivated } from "../component/lifecycle";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { shallowClone } from "@rue/muonic/SnapshotManager";
import { AnyObject, Booleanny } from "@rue/types";



type ConditionalOptions = {
    transition?: unknown //TODO:,
}


let currentRenderType: 'create' | 'show' | 'activate' = 'create'

export function $if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction,): ConditionalRenderKit
export function $if($condition: ReactiveSignal<Booleanny>, type: 'create' | 'show' | 'activate', renderConditional: RenderFunction,): ConditionalRenderKit
export function $if($condition: ReactiveSignal<Booleanny>, param2: 'create' | 'show' | 'activate' | RenderFunction, renderConditional?: RenderFunction,): ConditionalRenderKit {
    const typeSpecified = typeof param2 === "string";
    const renderFunction = typeSpecified ? renderConditional : param2;
    const type = typeSpecified ? param2 : 'create';
    if (!renderFunction) throw new Error('render function is missing');
    currentRenderType = type;
    return _if($condition, renderFunction, 'if', type)
}

function _if($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction, statementType: 'if' | 'elseIf' = 'if', type: 'create' | 'show' | 'activate' = currentRenderType) {
    const _renderConditional = type === 'activate' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
    return new ConditionalRenderKit(statementType, _renderConditional, type, $condition)
}

export function $elseIf($condition: ReactiveSignal<Booleanny>, renderConditional: RenderFunction) {
    return _if($condition, renderConditional, 'elseIf')
}

export function $else(renderConditional: RenderFunction) {
    const type = currentRenderType;
    const _renderConditional = type === 'activate' ? wrapToPreserve(renderConditional) : wrapToNormalize(renderConditional)
    return new ConditionalRenderKit('else', _renderConditional, currentRenderType)
}




let _preserveAll = false;

export function preserveAllRequested() {
    return _preserveAll;
}

function wrapToPreserve(renderConditional: RenderFunction) {
    let nodeEntities: NodeEntity[];
    return () => {
        if (!nodeEntities) {
            _preserveAll = true;
            nodeEntities = normalizeToArray(renderConditional());
            _preserveAll = false;
            return nodeEntities;
        }
        return nodeEntities;
    }
}

function wrapToNormalize(renderConditional: RenderFunction) {
    return () => normalizeToArray(renderConditional())
}







// function validateConditionalStatements(statements: ConditionalRenderKit[]) {

// }


export function watchForRenderAndPreserve<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: (newValue: any, oldValue: any) => void, options?: { once: true }) {
    const component = getCurrentComponent();
    if (!component) throw new Error("No component found")

    const watcher = watchForRender(target, handler, options);
    const oldValue = hasSignal(target) ? target() : shallowClone(target)
    onDeactivated(() => {
        watcher.stop()
    })
    if (hasSignal(target)) {
        onActivated(() => {
            handler(target(), oldValue) //FIX: Why am I calling this here? what about snapshots?
            // pushComponent(component)
            watchForRender(target, handler, options)
            // popComponent()
        })
    }
    else {
        onActivated(() => {
            handler(target, oldValue)
            // pushComponent(component)
            watchForRender(target, handler, options)
            // popComponent()
        })
    }
    return watcher
}

export function initializeRenderAndPreserve(handler: () => void) {
    const watcher = initializeRender(handler);

    onDeactivated(() => {
        watcher.stop()
    })

    onActivated(() => {
        initializeRender(handler)
    })
}