import { isGetter, isIon, MutableIon, atRender, queueTask, RUN_EAGERLY, swiftUpdate, toValue, trackForRender } from "@rue/quarky";
import { MaybeIon } from "../component/x-Input";
import { getFlask } from "@rue/flask";
import {toString} from './attributes'

export function isMutableIon(ion: unknown): ion is MutableIon<any> {
   return isIon(ion) && 'value' in ion
}

export function setUpMutables(element: Element, attributes: { [key: string]: MaybeIon<any> }) {
   switch (element.tagName) {
      case 'INPUT':
         bindInput(<HTMLInputElement>element, attributes)

      case 'SELECT':
         bindSelect(<HTMLSelectElement>element, attributes)

      case 'TEXTAREA':
         return bindTextInput(<HTMLTextAreaElement>element, attributes);
   }
}

function bindCheckboxInput(element: HTMLInputElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:checked' in attributes))
      return;
   const ion = attributes['mu:checked'];
   console.log('checkbox input', ion)
   delete attributes['mu:checked'];
   attributes.checked = ion;
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      setUpInputListener(element, ion, 'checked')
   }
}
function bindRadioInput(element: HTMLInputElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:checked' in attributes))
      return;
   const ion = attributes['mu:checked'];
   console.log('radio')
   const radioValue = attributes.value;
   delete attributes['mu:checked'];
   attributes.checked = () => ion() === radioValue;
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      setUpInputListener(element, ion)
   }
}

function bindTextInput(element: HTMLInputElement | HTMLTextAreaElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:value' in attributes))
      return;
   const ion = attributes['mu:value'];
   delete attributes['mu:value'];
   attributes.value = ion;
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:value must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      setUpInputListener(element, ion)
   }
}

function bindInput(element: HTMLInputElement, attributes: { [key: string]: MaybeIon<any> }) {
   switch (attributes.type) {
      case 'radio':
         bindRadioInput(element, attributes)
         break;

      case 'checkbox':
         bindCheckboxInput(element, attributes)
         break;

      default:
         bindTextInput(element, attributes)
         break;
   }
}

function bindSelect(element: HTMLSelectElement, attributes: { [key: string]: MaybeIon<any> }) {
   if (!('mu:value' in attributes))
      return;
   const ion = attributes['mu:value'];
   const flask = getFlask()
   trackForRender(ion, () => {
      atRender(() => {
         queueTask(() => {
            element.value = toString(toValue(ion))
         })
      })
   }, flask, RUN_EAGERLY)
   delete attributes['mu:value'];
   if (!isGetter(ion)) {
      if (__DEV__) console.warn('mu:checked must receive a mutable ion for two-way binding to work', ion)
   }
   else {
      element.addEventListener('change', e => {
         swiftUpdate(() => {
            updateIonWithInput(ion, e)
         })
      })
   }
}


// function bindTextarea(element: Element, Slot: RenderSlot | undefined) {
//    if (!Slot || !isFunction(Slot)) return;
//    const nodeEntities = Slot();
//    const kit = nodeEntities instanceof Array ? nodeEntities[0] : nodeEntities;
//    if (!isPlainObject(kit) && !('mu' in kit)) return;
//    const ion = kit.mu;
//    const flask = getFlask()
//    trackForRender(ion, () => {
//       queueInternalRender(() => {
//          element.value = toString(ion())
//       }, flask)
//    }, flask, RUN_EAGERLY)
//    if (!isMutableIon(ion)) {
//       if ( __DEV__) console.warn('mu:value must receive a mutable ion for two-way binding to work')
//    }
//    else {
//       setUpInputListener(element, ion)
//    }
//    return ion;
// }

function setUpCheckboxInputListener(element: Element, ion: { value: any } | { set: (value: any) => any }) {
   element.addEventListener('input', e => {
      // instantUpdate(() => {
      updateIonWithInput(ion, e, 'checked')
      // })
   })
}

function setUpInputListener(element: Element, ion: { value: any } | { set: (value: any) => any }, key: string = 'value') {
   element.addEventListener('input', e => {
      updateIonWithInput(ion, e, key)
   })
}

function updateIonWithInput(ion: { value: any } | { set: (value: any) => any }, e: Event, key: string = 'value') {
   if ('value' in ion) {
      ion.value =
         //@ts-expect-error
         e.currentTarget?.[key];
      console.log('@&@ e.currentTarget?.[key]', key, e.currentTarget?.[key])
   }
   else {
      const maybeIon = ion()
      if (isMutableIon(maybeIon)) {
         maybeIon.value =
            //@ts-expect-error
            e.currentTarget?.[key];
      }
      else {
         throw new Error('invalid two-way binding')
      }
   }
}

