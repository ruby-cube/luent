import { getCurrentInstance, PropType } from "vue"

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


export function isSettingUpComponent() {
  return Boolean(getCurrentInstance());
}
