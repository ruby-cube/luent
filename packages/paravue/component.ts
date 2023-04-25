import { $listen, Callback, ListenerOptions } from "@rue/planify"
import { ComponentInternalInstance, getCurrentInstance, onBeforeUnmount, PropType, onUnmounted as _onUnmounted } from "vue"

export const OPTIONAL = Symbol("optionalProp")

export function propDef<C extends PropType<T>, T>(type: C) {
  return {
    type,
    defaultDef(defaultValue: T) {
      return {
        type,
        default: defaultValue,
        required: false,
        validate(validator: (value: any) => boolean) {
          return {
            type,
            default: defaultValue,
            required: false,
            validator
          }
        }
      }
    },
    required: true,
    validate(validator: (value: any) => boolean) {
      return {
        type,
        required: true,
        validator
      }
    }
  }
}


export function inComponentSetup() {
  return Boolean(getCurrentInstance());
}



const componentMap = new WeakMap();
export function onUnmounted(handler: Callback, options?: ListenerOptions) {
    const currentInstance = getCurrentInstance();
    if (!currentInstance) throw new Error("onUnmounted must be called from within component setup function")
    const existingCallbacks = componentMap.get(currentInstance);
    const handlers = existingCallbacks ? existingCallbacks : new Set();
    if (!existingCallbacks) {
        componentMap.set(currentInstance, handlers)
        onBeforeUnmount(() => {
            _onUnmounted(() => {
                for (const cb of handlers) {
                    cb()
                }
            })
        })
    }
    return $listen(handler, options, {
        enroll(handler) {
            handlers.add(handler);
        },
        remove(handler) {
            handlers.delete(handler)
        },
        onceAsDefault: true
    })
}

if (__TEST__) {
    onUnmounted.getCallbacks = (component: ComponentInternalInstance) => componentMap.get(component);
}
