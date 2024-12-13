import { asMetaIonizedModel, IonizedModel } from "./ionize";

export function isReadonlyIonizedModel(value: any) {
   if (!(value instanceof Object)) return false;
   return READONLY_IONIC_MODEL in value;
}
export const READONLY_IONIC_MODEL = Symbol('readonlyIonicModel')

export function asReadonlyIonizedModel(model: IonizedModel) {
   // TODO: what to do if is reined model with private properties?
   if (isReadonlyIonizedModel(model))
      return model;
   const meta = asMetaIonizedModel(model)
   if (meta.asReadonly)
      return meta.asReadonly
   return createReadonlyIonizedModel(model);
}

function createReadonlyIonizedModel(model: IonizedModel) {
   const readonlyModel = Object.create(model);
   Object.defineProperty(readonlyModel, READONLY_IONIC_MODEL, { value: true })
   return readonlyModel
}
